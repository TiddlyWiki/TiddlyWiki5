/*\
title: $:/plugins/tiddlywiki/multiwikiserver/mws-save-archive.js
type: application/javascript
module-type: command

Command to load an archive of recipes, bags and tiddlers to a directory

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "mws-save",
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
	if(this.params.length < 1) {
		return "Missing pathname";
	}
	var archivePath = this.params[0];
	saveArchive(archivePath);
	return null;
};

function saveArchive(archivePath) {
	const fs = require("fs"),
	path = require("path");
	function saveJsonFile(filename,json) {
		const filepath = path.resolve(archivePath,filename);
		console.log(filepath);
		$tw.utils.createFileDirectories(filepath);
		fs.writeFileSync(filepath,JSON.stringify(json,null,4));
	}
	for(const recipeInfo of $tw.mws.store.listRecipes()) {
		console.log(`Recipe ${recipeInfo.recipe_name}`);
		saveJsonFile(`recipes/${encodeURIComponent(recipeInfo.recipe_name)}.json`,recipeInfo);
	}
	for(const bagInfo of $tw.mws.store.listBags()) {
		console.log(`Bag ${bagInfo.bag_name}`);
		saveJsonFile(`bags/${encodeURIComponent(bagInfo.bag_name)}/meta.json`,bagInfo);
		for(const title of $tw.mws.store.getBagTiddlers(bagInfo.bag_name)) {
			const tiddlerInfo = $tw.mws.store.getBagTiddler(title,bagInfo.bag_name);
			saveJsonFile(`bags/${encodeURIComponent(bagInfo.bag_name)}/tiddlers/${encodeURIComponent(title)}.json`,tiddlerInfo.tiddler);
		}
	}
}

exports.Command = Command;

})();
