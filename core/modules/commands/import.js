/*\
title: $:/core/modules/commands/import.js
type: application/javascript
module-type: command

Command to import tiddlers from a file

\*/

"use strict";

exports.info = {
	name: "import",
	synchronous: true
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
	if(this.params.length < 2) {
		return "Missing parameters";
	}
	const filename = self.params[0];
	const deserializer = self.params[1];
	const title = self.params[2] || filename;
	const encoding = self.params[3] || "utf8";
	const text = fs.readFileSync(filename,encoding);
	const tiddlers = this.commander.wiki.deserializeTiddlers(null,text,{title},{deserializer});
	$tw.utils.each(tiddlers,(tiddler) => {
		self.commander.wiki.importTiddler(new $tw.Tiddler(tiddler));
	});
	this.commander.log(`${tiddlers.length} tiddler(s) imported`);
	return null;
};

exports.Command = Command;
