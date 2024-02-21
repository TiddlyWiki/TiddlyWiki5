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
console.log(`Successfully required better-sqlite3`)
	if(!$tw.sqlite3.Database) {
		logger.alert("The plugin 'tiddlywiki/multiwikiserver' requires the better-sqlite3 npm package to be installed. Run 'npm install' in the root of the TiddlyWiki repository");
		return;
	}
	// Create and initialise the tiddler store and upload manager
	var SqlTiddlerStore = require("$:/plugins/tiddlywiki/multiwikiserver/sql-tiddler-store.js").SqlTiddlerStore,
		store = new SqlTiddlerStore({
			databasePath: path.resolve($tw.boot.wikiPath,"store/database.sqlite")
		}),
		UploadManager = require("$:/plugins/tiddlywiki/multiwikiserver/upload-manager.js").UploadManager,
		uploadManager = new UploadManager({
			inboxPath: path.resolve($tw.boot.wikiPath,"store/inbox"),
			store: store
		});
	$tw.mws = {
		store: store,
		uploadManager: uploadManager
	};
	// Performance timing
	console.time("mws-initial-load");
	// Create docs bag and recipe
	$tw.mws.store.createBag("docs","TiddlyWiki Documentation from https://tiddlywiki.com/");
	$tw.mws.store.createRecipe("docs",["docs"],"TiddlyWiki Documentation from https://tiddlywiki.com/");
	$tw.mws.store.saveTiddlersFromPath(path.resolve($tw.boot.corePath,$tw.config.editionsPath,"tw5.com/tiddlers"),"docs");
	$tw.mws.store.createBag("dev-docs","TiddlyWiki Developer Documentation from https://tiddlywiki.com/dev/");
	$tw.mws.store.createRecipe("dev-docs",["dev-docs"],"TiddlyWiki Developer Documentation from https://tiddlywiki.com/dev/");
	$tw.mws.store.saveTiddlersFromPath(path.resolve($tw.boot.corePath,$tw.config.editionsPath,"dev/tiddlers"),"dev-docs");
	// Create bags and recipes
	$tw.mws.store.createBag("bag-alpha","A test bag");
	$tw.mws.store.createBag("bag-beta","Another test bag");
	$tw.mws.store.createBag("bag-gamma","A further test bag");
	$tw.mws.store.createRecipe("recipe-rho",["bag-alpha","bag-beta"],"First wiki");
	$tw.mws.store.createRecipe("recipe-sigma",["bag-alpha","bag-gamma"],"Second Wiki");
	$tw.mws.store.createRecipe("recipe-tau",["bag-alpha"],"Third Wiki");
	$tw.mws.store.createRecipe("recipe-upsilon",["bag-alpha","bag-gamma","bag-beta"],"Fourth Wiki");
	// Save tiddlers
	$tw.mws.store.saveBagTiddler({title: "$:/SiteTitle",text: "Bag Alpha"},"bag-alpha");
	$tw.mws.store.saveBagTiddler({title: "$:/SiteTitle",text: "Bag Beta"},"bag-beta");
	$tw.mws.store.saveBagTiddler({title: "$:/SiteTitle",text: "Bag Gamma"},"bag-gamma");
	console.timeEnd("mws-initial-load");
};

})();
