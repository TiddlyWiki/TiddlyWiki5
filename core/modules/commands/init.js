/*\
title: $:/core/modules/commands/init.js
type: application/javascript
module-type: command

Command to initialise an empty wiki folder

\*/

"use strict";

exports.info = {
	name: "init",
	synchronous: true
};

const Command = function(params,commander) {
	this.params = params;
	this.commander = commander;
};

Command.prototype.execute = function() {
	const fs = require("fs");
	const path = require("path");
	// Check that we don't already have a valid wiki folder
	if($tw.boot.wikiTiddlersPath || ($tw.utils.isDirectory($tw.boot.wikiPath) && !$tw.utils.isDirectoryEmpty($tw.boot.wikiPath))) {
		return "Wiki folder is not empty";
	}
	// Loop through each of the specified editions
	const editions = this.params.length > 0 ? this.params : ["empty"];
	for(let editionIndex = 0;editionIndex < editions.length;editionIndex++) {
		const editionName = editions[editionIndex];
		// Check the edition exists
		const editionPath = $tw.findLibraryItem(editionName,$tw.getLibraryItemSearchPaths($tw.config.editionsPath,$tw.config.editionsEnvVar));
		if(!$tw.utils.isDirectory(editionPath)) {
			return `Edition '${editionName}' not found`;
		}
		// Copy the edition content
		const err = $tw.utils.copyDirectory(editionPath,$tw.boot.wikiPath);
		if(!err) {
			this.commander.streams.output.write(`Copied edition '${editionName}' to ${$tw.boot.wikiPath}\n`);
		} else {
			return err;
		}
	}
	// Tweak the tiddlywiki.info to remove any included wikis
	const packagePath = `${$tw.boot.wikiPath}/tiddlywiki.info`;
	const packageJson = $tw.utils.parseJSONSafe(fs.readFileSync(packagePath));
	delete packageJson.includeWikis;
	fs.writeFileSync(packagePath,JSON.stringify(packageJson,null,$tw.config.preferences.jsonSpaces));
	return null;
};

exports.Command = Command;
