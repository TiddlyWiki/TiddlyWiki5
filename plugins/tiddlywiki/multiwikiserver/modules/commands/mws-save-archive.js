/*\
title: $:/plugins/tiddlywiki/multiwikiserver/commands/mws-save-archive.js
type: application/javascript
module-type: command

Command to load an archive of recipes, bags and tiddlers to a directory

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "mws-save-archive",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	// this.callback = callback; // no callback for synchronous commands
};

Command.prototype.execute = async function() {
	var self = this;
	// Check parameters
	if(this.params.length < 1) {
		return "Missing pathname";
	}
	var archivePath = this.params[0];
	await saveArchive(archivePath);
	return null;
};

async function saveArchive(archivePath) {
	const fs = require("fs"),
	path = require("path");
	function saveJsonFile(filename,json) {
		const filepath = path.resolve(archivePath,filename);
		console.log(filepath);
		$tw.utils.createFileDirectories(filepath);
		fs.writeFileSync(filepath,JSON.stringify(json,null,4));
	}
	for(const recipeInfo of await $tw.mws.store.listRecipes()) {
		console.log(`Recipe ${recipeInfo.recipe_name}`);
		saveJsonFile(`recipes/${$tw.utils.encodeURIComponentExtended(recipeInfo.recipe_name)}.json`,recipeInfo);
	}
	for(const bagInfo of await $tw.mws.store.listBags()) {
		console.log(`Bag ${bagInfo.bag_name}`);
		saveJsonFile(`bags/${$tw.utils.encodeURIComponentExtended(bagInfo.bag_name)}/meta.json`,bagInfo);
		for(const title of await $tw.mws.store.getBagTiddlers(bagInfo.bag_name)) {
			const tiddlerInfo = await $tw.mws.store.getBagTiddler(title,bagInfo.bag_name);
			saveJsonFile(`bags/${$tw.utils.encodeURIComponentExtended(bagInfo.bag_name)}/tiddlers/${$tw.utils.encodeURIComponentExtended(title)}.json`,tiddlerInfo.tiddler);
		}
	}
}

exports.Command = Command;

})();
