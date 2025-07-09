/*\
title: $:/core/modules/commands/savetiddler.js
type: application/javascript
module-type: command

Command to save the content of a tiddler to a file

\*/

"use strict";

exports.info = {
	name: "savetiddler",
	synchronous: false
};

const Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 2) {
		return "Missing filename";
	}
	const self = this;
	const fs = require("fs");
	const path = require("path");
	const title = this.params[0];
	const filename = path.resolve(this.commander.outputPath,this.params[1]);
	const tiddler = this.commander.wiki.getTiddler(title);
	if(tiddler) {
		const type = tiddler.fields.type || "text/vnd.tiddlywiki";
		const contentTypeInfo = $tw.config.contentTypeInfo[type] || {encoding: "utf8"};
		$tw.utils.createFileDirectories(filename);
		fs.writeFile(filename,tiddler.fields.text,contentTypeInfo.encoding,(err) => {
			self.callback(err);
		});
	} else {
		return `Missing tiddler: ${title}`;
	}
	return null;
};

exports.Command = Command;
