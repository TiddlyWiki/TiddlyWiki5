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
	// Create and initialise the tiddler store and upload manager
	var AttachmentStore = require("$:/plugins/tiddlywiki/multiwikiserver/attachment-store.js").AttachmentStore,
		attachmentStore = new AttachmentStore({
			storePath: path.resolve($tw.boot.wikiPath,"store/")
		}),
		SqlTiddlerStore = require("$:/plugins/tiddlywiki/multiwikiserver/sql-tiddler-store.js").SqlTiddlerStore,
		store = new SqlTiddlerStore({
			databasePath: path.resolve($tw.boot.wikiPath,"store/database.sqlite"),
			engine: $tw.wiki.getTiddlerText("$:/config/MultiWikiServer/Engine","better"), // better || wasm
			attachmentStore: attachmentStore
		});
	$tw.mws = {
		store: store
	};
	// Performance timing
	console.time("mws-initial-load");
	// Copy TiddlyWiki core editions
	function copyEdition(options) {
		console.log(`Copying edition ${options.tiddlersPath}`);
		$tw.mws.store.createBag(options.bagName,options.bagDescription);
		$tw.mws.store.createRecipe(options.recipeName,[options.bagName],options.recipeDescription);
		$tw.mws.store.saveTiddlersFromPath(path.resolve($tw.boot.corePath,$tw.config.editionsPath,options.tiddlersPath),options.bagName);
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
	$tw.mws.store.createBag("bag-alpha","A test bag");
	$tw.mws.store.createBag("bag-beta","Another test bag");
	$tw.mws.store.createBag("bag-gamma","A further test bag");
	$tw.mws.store.createRecipe("recipe-rho",["bag-alpha","bag-beta"],"First wiki");
	$tw.mws.store.createRecipe("recipe-sigma",["bag-alpha","bag-gamma"],"Second Wiki");
	$tw.mws.store.createRecipe("recipe-tau",["bag-alpha"],"Third Wiki");
	$tw.mws.store.createRecipe("recipe-upsilon",["bag-alpha","bag-gamma","bag-beta"],"Fourth Wiki");
	// Save tiddlers
	$tw.mws.store.saveBagTiddler({title: "$:/SiteTitle",text: "Bag Alpha"},"bag-alpha");
	$tw.mws.store.saveBagTiddler({title: "😀😃😄😁😆🥹😅😂",text: "Bag Alpha"},"bag-alpha");
	$tw.mws.store.saveBagTiddler({title: "$:/SiteTitle",text: "Bag Beta"},"bag-beta");
	$tw.mws.store.saveBagTiddler({title: "$:/SiteTitle",text: "Bag Gamma"},"bag-gamma");
	console.timeEnd("mws-initial-load");
};

})();
