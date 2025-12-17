/*\
title: $:/core/modules/commands/savetiddler.js
type: application/javascript
module-type: command

Command to save the content of a tiddler to a file

\*/

"use strict";

exports.info = {
	name: "savetiddler",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = async function() {
	if(this.params.length < 2) {
		return "Missing filename";
	}
	var self = this,
		fs = require("fs/promises"),
		path = require("path"),
		title = this.params[0],
		filename = path.resolve(this.commander.outputPath,this.params[1]),
		tiddler = this.commander.wiki.getTiddler(title);

	if(!tiddler) return "Missing tiddler: " + title;
	
	var type = tiddler.fields.type || "text/vnd.tiddlywiki",
		contentTypeInfo = $tw.config.contentTypeInfo[type] || {encoding: "utf8"};
	$tw.utils.createFileDirectories(filename);
	return await fs.writeFile(filename,tiddler.fields.text,contentTypeInfo.encoding)
		.then(() => null, e => e);

};

exports.Command = Command;
