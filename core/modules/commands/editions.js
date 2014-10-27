/*\
title: $:/core/modules/commands/editions.js
type: application/javascript
module-type: command

Command to list the available editions

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "editions",
	synchronous: true
};

var Command = function(params,commander) {
	this.params = params;
	this.commander = commander;
};

Command.prototype.execute = function() {
	var fs = require("fs"),
		path = require("path"),
		self = this;
	// Enumerate the edition paths
	var editionPaths = $tw.getLibraryItemSearchPaths($tw.config.editionsPath,$tw.config.editionsEnvVar),
		editions = {};
	for(var editionIndex=0; editionIndex<editionPaths.length; editionIndex++) {
		var editionPath = editionPaths[editionIndex];
		// Enumerate the folders
		var entries = fs.readdirSync(editionPath);
		for(var entryIndex=0; entryIndex<entries.length; entryIndex++) {
			var entry = entries[entryIndex];
			// Check if directories have a valid tiddlywiki.info
			if(!editions[entry] && $tw.utils.isDirectory(path.resolve(editionPath,entry))) {
				var info;
				try {
					info = JSON.parse(fs.readFileSync(path.resolve(editionPath,entry,"tiddlywiki.info"),"utf8"));
				} catch(ex) {
				}
				if(info) {
					editions[entry] = info.description || "";
				}
			}
		}
	}
	// Output the list
	this.commander.streams.output.write("Available editions:\n\n");
	$tw.utils.each(editions,function(description,name) {
		self.commander.streams.output.write("    " + name + ": " + description + "\n");
	});
	this.commander.streams.output.write("\n");
	return null;
};

exports.Command = Command;

})();
