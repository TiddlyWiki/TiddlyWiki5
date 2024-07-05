/*\
title: $:/plugins/tiddlywiki/multiwikiserver/commands/mws-load-wiki-folder.js
type: application/javascript
module-type: command

Command to create and load a bag for the specified core editions

--mws-load-wiki-folder <path> <bag-name> <bag-description> <recipe-name> <recipe-description>

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "mws-load-wiki-folder",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this;
	// Check parameters
	if(this.params.length < 5) {
		return "Missing parameters for --mws-load-wiki-folder command";
	}
	var archivePath = this.params[0];
	loadWikiFolder({
		wikiPath: this.params[0],
		bagName: this.params[1],
		bagDescription: this.params[2],
		recipeName: this.params[3],
		recipeDescription: this.params[4]
	});
	return null;
};

// Function to convert a plugin name to a bag name
function makePluginBagName(type,publisher,name) {
	return "$:/" + type + "/" + (publisher ? publisher + "/" : "") + name;
}

// Copy TiddlyWiki core editions
function loadWikiFolder(options) {
	const path = require("path"),
		fs = require("fs");
	// Read the tiddlywiki.info file
	const wikiInfoPath = path.resolve(options.wikiPath,$tw.config.wikiInfo);
	let wikiInfo;
	if(fs.existsSync(wikiInfoPath)) {
		wikiInfo = $tw.utils.parseJSONSafe(fs.readFileSync(wikiInfoPath,"utf8"),function() {return null;});
	}
	if(wikiInfo) {
		// Create the bag
		const result = $tw.mws.store.createBag(options.bagName,options.bagDescription);
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
		$tw.mws.store.createRecipe(options.recipeName,recipeList,options.recipeDescription);
		$tw.mws.store.saveTiddlersFromPath(path.resolve($tw.boot.corePath,$tw.config.editionsPath,options.wikiPath,$tw.config.wikiTiddlersSubDir),options.bagName);	
	}
}

exports.Command = Command;

})();
