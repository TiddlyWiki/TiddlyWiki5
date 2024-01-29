/*\
title: $:/plugins/tiddlywiki/multiwikiserver/init.js
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
	var path = require("path");
	// Install the sqlite3 global namespace
	$tw.sqlite3 = {
		Database: null
	};
	// Check that better-sqlite3 is installed
	var logger = new $tw.utils.Logger("multiwikiserver");
	try {
		$tw.sqlite3.Database = require("better-sqlite3");
	} catch(e) {
	}
	if(!$tw.sqlite3.Database) {
		logger.alert("The plugin 'tiddlywiki/multiwikiserver' requires the better-sqlite3 npm package to be installed. Run 'npm install' in the root of the TiddlyWiki repository");
		return;
	}
	// Compute the database path
	var databasePath = path.resolve($tw.boot.wikiPath,"store/database.sqlite");
	// Create and initialise the tiddler store
	var SqlTiddlerStore = require("$:/plugins/tiddlywiki/multiwikiserver/sql-tiddler-store.js").SqlTiddlerStore;
	$tw.sqlTiddlerStore = new SqlTiddlerStore({
		databasePath: databasePath
	});
	// Create docs bag and recipe
	$tw.sqlTiddlerStore.createBag("docs","TiddlyWiki Documentation from https://tiddlywiki.com/");
	$tw.sqlTiddlerStore.createRecipe("docs",["docs"],"TiddlyWiki Documentation from https://tiddlywiki.com/");
	$tw.sqlTiddlerStore.saveTiddlersFromPath(path.resolve($tw.boot.corePath,$tw.config.editionsPath,"tw5.com/tiddlers"),"docs");
	$tw.sqlTiddlerStore.createBag("dev-docs","TiddlyWiki Developer Documentation from https://tiddlywiki.com/dev/");
	$tw.sqlTiddlerStore.createRecipe("dev-docs",["dev-docs"],"TiddlyWiki Developer Documentation from https://tiddlywiki.com/dev/");
	$tw.sqlTiddlerStore.saveTiddlersFromPath(path.resolve($tw.boot.corePath,$tw.config.editionsPath,"dev/tiddlers"),"dev-docs");
	// Create bags and recipes
	$tw.sqlTiddlerStore.createBag("bag-alpha","A test bag");
	$tw.sqlTiddlerStore.createBag("bag-beta","Another test bag");
	$tw.sqlTiddlerStore.createBag("bag-gamma","A further test bag");
	$tw.sqlTiddlerStore.createRecipe("recipe-rho",["bag-alpha","bag-beta"],"First wiki");
	$tw.sqlTiddlerStore.createRecipe("recipe-sigma",["bag-alpha","bag-gamma"],"Second Wiki");
	$tw.sqlTiddlerStore.createRecipe("recipe-tau",["bag-alpha"],"Third Wiki");
	$tw.sqlTiddlerStore.createRecipe("recipe-upsilon",["bag-alpha","bag-gamma","bag-beta"],"Fourth Wiki");
	// Save tiddlers
	$tw.sqlTiddlerStore.saveBagTiddler({title: "$:/SiteTitle",text: "Bag Alpha"},"bag-alpha");
	$tw.sqlTiddlerStore.saveBagTiddler({title: "$:/SiteTitle",text: "Bag Beta"},"bag-beta");
	$tw.sqlTiddlerStore.saveBagTiddler({title: "$:/SiteTitle",text: "Bag Gamma"},"bag-gamma");
};

})();
