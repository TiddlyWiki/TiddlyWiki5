/*\
title: $:/plugins/tiddlywiki/multiwikiserver/startup.js
type: application/javascript
module-type: startup

Multi wiki server initialisation

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "multiwikiserver";
exports.platforms = ["node"];
exports.before = ["story"];
exports.synchronous = true;

exports.startup = function() {
	const store = setupStore();
	loadStore(store);
	$tw.mws = {
		store: store,
		serverManager: new ServerManager({
			store: store
		})
	};
}

function setupStore() {
	const path = require("path");
	// Create and initialise the attachment store and the tiddler store
	const AttachmentStore = require("$:/plugins/tiddlywiki/multiwikiserver/store/attachments.js").AttachmentStore,
		attachmentStore = new AttachmentStore({
			storePath: path.resolve($tw.boot.wikiPath,"store/")
		}),
		SqlTiddlerStore = require("$:/plugins/tiddlywiki/multiwikiserver/store/sql-tiddler-store.js").SqlTiddlerStore,
		store = new SqlTiddlerStore({
			databasePath: path.resolve($tw.boot.wikiPath,"store/database.sqlite"),
			engine: $tw.wiki.getTiddlerText("$:/config/MultiWikiServer/Engine","better"), // better || wasm
			attachmentStore: attachmentStore
		});
	return store;
}

function loadStore(store) {
	const path = require("path"),
		fs = require("fs");
	// Performance timing
	console.time("mws-initial-load");
	// Copy plugins
	var makePluginBagName = function(type,publisher,name) {
			return "$:/" + type + "/" + (publisher ? publisher + "/" : "") + name;
		},
		savePlugin = function(pluginFields,type,publisher,name) {
			const bagName = makePluginBagName(type,publisher,name);
			const result = store.createBag(bagName,pluginFields.description || "(no description)",{allowPrivilegedCharacters: true});
			if(result) {
				console.log(`Error creating plugin bag ${bagname}: ${JSON.stringify(result)}`);
			}
			store.saveBagTiddler(pluginFields,bagName);
		},
		collectPlugins = function(folder,type,publisher) {
			var pluginFolders = $tw.utils.getSubdirectories(folder) || [];
			for(var p=0; p<pluginFolders.length; p++) {
				const pluginFolderName = pluginFolders[p];
				if(!$tw.boot.excludeRegExp.test(pluginFolderName)) {
					var pluginFields = $tw.loadPluginFolder(path.resolve(folder,"./" + pluginFolderName));
					if(pluginFields && pluginFields.title) {
						savePlugin(pluginFields,type,publisher,pluginFolderName);
					}
				}
			}
		},
		collectPublisherPlugins = function(folder,type) {
			var publisherFolders = $tw.utils.getSubdirectories(folder) || [];
			for(var t=0; t<publisherFolders.length; t++) {
				const publisherFolderName = publisherFolders[t];
				if(!$tw.boot.excludeRegExp.test(publisherFolderName)) {
					collectPlugins(path.resolve(folder,"./" + publisherFolderName),type,publisherFolderName);
				}
			}
		};
	$tw.utils.each($tw.getLibraryItemSearchPaths($tw.config.pluginsPath,$tw.config.pluginsEnvVar),function(folder) {
		collectPublisherPlugins(folder,"plugin");
	});
	$tw.utils.each($tw.getLibraryItemSearchPaths($tw.config.themesPath,$tw.config.themesEnvVar),function(folder) {
		collectPublisherPlugins(folder,"theme");
	});
	$tw.utils.each($tw.getLibraryItemSearchPaths($tw.config.languagesPath,$tw.config.languagesEnvVar),function(folder) {
		collectPlugins(folder,"language");
	});
	// Copy TiddlyWiki core editions
	function copyEdition(options) {
		// Read the tiddlywiki.info file
		const wikiInfoPath = path.resolve($tw.boot.corePath,$tw.config.editionsPath,options.wikiPath,$tw.config.wikiInfo);
		let wikiInfo;
		if(fs.existsSync(wikiInfoPath)) {
			wikiInfo = $tw.utils.parseJSONSafe(fs.readFileSync(wikiInfoPath,"utf8"),function() {return null;});
		}
		if(wikiInfo) {
			// Create the bag
			const result = store.createBag(options.bagName,options.bagDescription);
			if(result) {
				console.log(`Error creating bag ${options.bagName} for edition ${options.wikiPath}: ${JSON.stringify(result)}`);
			}
			// Add plugins to the recipe list
			const recipeList = [];
			const processPlugins = function(type,plugins) {
				$tw.utils.each(plugins,function(pluginName) {
					const parts = pluginName.split("/");
					let publisher, name;
					if(parts.length === 2) {
						publisher = parts[0];
						name = parts[1];
					} else {
						name = parts[0];
					}
					recipeList.push(makePluginBagName(type,publisher,name));
				});	
			};
			processPlugins("plugin",wikiInfo.plugins);
			processPlugins("theme",wikiInfo.themes);
			processPlugins("language",wikiInfo.languages);
			// Create the recipe
			recipeList.push(options.bagName);
			store.createRecipe(options.recipeName,recipeList,options.recipeDescription);
			store.saveTiddlersFromPath(path.resolve($tw.boot.corePath,$tw.config.editionsPath,options.wikiPath,$tw.config.wikiTiddlersSubDir),options.bagName);	
		}
	}
	copyEdition({
		bagName: "docs",
		bagDescription: "TiddlyWiki Documentation from https://tiddlywiki.com",
		recipeName: "docs",
		recipeDescription: "TiddlyWiki Documentation from https://tiddlywiki.com",
		wikiPath: "tw5.com"
	});
	copyEdition({
		bagName: "dev-docs",
		bagDescription: "TiddlyWiki Developer Documentation from https://tiddlywiki.com/dev",
		recipeName: "dev-docs",
		recipeDescription: "TiddlyWiki Developer Documentation from https://tiddlywiki.com/dev",
		wikiPath: "dev"
	});
	copyEdition({
		bagName: "tour",
		bagDescription: "TiddlyWiki Interactive Tour from https://tiddlywiki.com",
		recipeName: "tour",
		recipeDescription: "TiddlyWiki Interactive Tour from https://tiddlywiki.com",
		wikiPath: "tour"
	});
	// copyEdition({
	// 	bagName: "full",
	// 	bagDescription: "TiddlyWiki Fully Loaded Edition from https://tiddlywiki.com",
	// 	recipeName: "full",
	// 	recipeDescription: "TiddlyWiki Fully Loaded Edition from https://tiddlywiki.com",
	// 	wikiPath: "full"
	// });
	// Create bags and recipes
	store.createBag("bag-alpha","A test bag");
	store.createBag("bag-beta","Another test bag");
	store.createBag("bag-gamma","A further test bag");
	store.createRecipe("recipe-rho",["bag-alpha","bag-beta"],"First wiki");
	store.createRecipe("recipe-sigma",["bag-alpha","bag-gamma"],"Second Wiki");
	store.createRecipe("recipe-tau",["bag-alpha"],"Third Wiki");
	store.createRecipe("recipe-upsilon",["bag-alpha","bag-gamma","bag-beta"],"Fourth Wiki");
	// Save tiddlers
	store.saveBagTiddler({title: "$:/SiteTitle",text: "Bag Alpha"},"bag-alpha");
	store.saveBagTiddler({title: "😀😃😄😁😆🥹😅😂",text: "Bag Alpha"},"bag-alpha");
	store.saveBagTiddler({title: "$:/SiteTitle",text: "Bag Beta"},"bag-beta");
	store.saveBagTiddler({title: "$:/SiteTitle",text: "Bag Gamma"},"bag-gamma");
	console.timeEnd("mws-initial-load");
}

function ServerManager(store) {
	this.servers = [];
}

ServerManager.prototype.createServer = function(options) {
	const MWSServer = require("$:/plugins/tiddlywiki/multiwikiserver/mws-server.js").Server,
		server = new MWSServer(options);
	this.servers.push(server);
	return server;
}

})();
