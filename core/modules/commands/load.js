/*\
title: $:/core/modules/commands/load.js
type: application/javascript
module-type: command

Command to load tiddlers from a file or directory

\*/

"use strict";

exports.info = {
	name: "load",
	synchronous: false
};

const Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	const self = this;
	const fs = require("fs");
	const path = require("path");
	if(this.params.length < 1) {
		return "Missing filename";
	}
	const tiddlers = $tw.loadTiddlersFromPath(self.params[0]);
	let count = 0;
	$tw.utils.each(tiddlers,(tiddlerInfo) => {
		$tw.utils.each(tiddlerInfo.tiddlers,(tiddler) => {
			self.commander.wiki.importTiddler(new $tw.Tiddler(tiddler));
			count++;
		});
	});
	if(!count && self.params[1] !== "noerror") {
		self.callback(`No tiddlers found in file "${self.params[0]}"`);
	} else {
		self.callback(null);
	}
	return null;
};

exports.Command = Command;
