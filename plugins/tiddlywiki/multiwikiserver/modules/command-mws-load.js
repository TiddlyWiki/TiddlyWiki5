/*\
title: $:/plugins/tiddlywiki/multiwikiserver/mws-load.js
type: application/javascript
module-type: command

Command to load tiddlers from a file or directory

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "mws-load",
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
		return "Missing filename";
	}
	var archivePath = this.params[0];
	loadBackupArchive(archivePath);
	return null;
};

function loadBackupArchive(archivePath) {
	const fs = require("fs"),
	path = require("path");
	// Iterate the bags
	const bagNames = fs.readdirSync(path.resolve(archivePath,"bags")).filter(filename => filename !== ".DS_Store");
	for(const bagName of bagNames) {
		console.log(`Reading bag ${bagName}`);
		$tw.mws.store.createBag(decodeURIComponent(bagName),"No description for " + bagName);
		// Read the metadata
		const jsonInfo = JSON.parse(fs.readFileSync(path.resolve(archivePath,"bags",bagName,"meta/info.json"),"utf8"));
		if(fs.existsSync(path.resolve(archivePath,"bags",bagName,"tiddlers"))) {
			// Read each tiddler
			const tiddlerFilenames = fs.readdirSync(path.resolve(archivePath,"bags",bagName,"tiddlers")).filter(filename => filename !== ".DS_Store");
			for(const tiddlerFilename of tiddlerFilenames) {
				const tiddlerPath = path.resolve(archivePath,"bags",bagName,"tiddlers",tiddlerFilename),
					jsonTiddler = fs.readFileSync(tiddlerPath,"utf8"),
					tiddler = JSON.parse(jsonTiddler);
				if(tiddler) {
					var sanitisedFields = Object.create(null);
					for(const fieldName in tiddler) {
						const fieldValue = tiddler[fieldName];
						let sanitisedValue = "";
						if(typeof fieldValue === "string") {
							sanitisedValue = fieldValue;
						} else if($tw.utils.isDate(fieldValue)) {
							sanitisedValue = $tw.utils.stringifyDate(fieldValue);
						} else if($tw.utils.isArray(fieldValue)) {
							sanitisedValue = $tw.utils.stringifyList(fieldValue);
						}
						sanitisedFields[fieldName] = sanitisedValue;
					}
					if(sanitisedFields.title) {
						$tw.mws.store.saveBagTiddler(sanitisedFields,decodeURIComponent(bagName));
					}
				} else {
					console.log(`Malformed JSON tiddler in file ${tiddlerPath}`);
				}
			}	
		}
	}
	// Iterate the recipes
	const recipeNames = fs.readdirSync(path.resolve(archivePath,"recipes")).filter(filename => filename !== ".DS_Store");
	for(const recipeName of recipeNames) {
		const jsonInfo = JSON.parse(fs.readFileSync(path.resolve(archivePath,"recipes",recipeName,"info.json"),"utf8"));
		$tw.mws.store.createRecipe(decodeURIComponent(recipeName),jsonInfo.recipe.map(recipeLine => recipeLine[0]),"No description for " + recipeName);
	}
}

exports.Command = Command;

})();
