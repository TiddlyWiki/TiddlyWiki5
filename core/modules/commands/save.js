/*\
title: $:/core/modules/commands/save.js
type: application/javascript
module-type: command

Saves individual tiddlers in their raw text or binary format to the specified files

\*/

"use strict";

exports.info = {
	name: "save",
	synchronous: true
};

const Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 1) {
		return "Missing filename filter";
	}
	const self = this;
	const fs = require("fs");
	const path = require("path");
	let result = null;
	const {wiki} = this.commander;
	const tiddlerFilter = this.params[0];
	const filenameFilter = this.params[1] || "[is[tiddler]]";
	const tiddlers = wiki.filterTiddlers(tiddlerFilter);
	$tw.utils.each(tiddlers,(title) => {
		if(!result) {
			const tiddler = self.commander.wiki.getTiddler(title);
			if(tiddler) {
				const fileInfo = $tw.utils.generateTiddlerFileInfo(tiddler,{
					directory: path.resolve(self.commander.outputPath),
					pathFilters: [filenameFilter],
					wiki,
					fileInfo: {
						overwrite: true
					}
				});
				if(self.commander.verbose) {
					console.log(`Saving "${title}" to "${fileInfo.filepath}"`);
				}
				try {
					$tw.utils.saveTiddlerToFileSync(tiddler,fileInfo);
				} catch(err) {
					result = `Error saving tiddler "${title}", to file: "${fileInfo.filepath}"`;
				}
			} else {
				result = `Tiddler '${title}' not found`;
			}
		}
	});
	return result;
};

exports.Command = Command;
