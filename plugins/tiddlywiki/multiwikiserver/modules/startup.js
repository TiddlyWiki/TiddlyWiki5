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
	const path = require("path");
	// Performance timing
	console.time("mws-initial-load");
	// Copy TiddlyWiki core editions
	function copyEdition(options) {
		console.log(`Copying edition ${options.tiddlersPath}`);
		store.createBag(options.bagName,options.bagDescription);
		store.createRecipe(options.recipeName,[options.bagName],options.recipeDescription);
		store.saveTiddlersFromPath(path.resolve($tw.boot.corePath,$tw.config.editionsPath,options.tiddlersPath),options.bagName);
	}
	copyEdition({
		bagName: "docs",
		bagDescription: "TiddlyWiki Documentation from https://tiddlywiki.com",
		recipeName: "docs",
		recipeDescription: "TiddlyWiki Documentation from https://tiddlywiki.com",
		tiddlersPath: "tw5.com/tiddlers"
	});
	copyEdition({
		bagName: "dev-docs",
		bagDescription: "TiddlyWiki Developer Documentation from https://tiddlywiki.com/dev",
		recipeName: "dev-docs",
		recipeDescription: "TiddlyWiki Developer Documentation from https://tiddlywiki.com/dev",
		tiddlersPath: "dev/tiddlers"
	});
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
