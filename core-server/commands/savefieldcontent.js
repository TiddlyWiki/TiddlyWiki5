/*\
title: $:/core/modules/commands/savefieldcontent.js
type: application/javascript
module-type: command

Command to save the named field of selected tiddlers to a folder of files.
The field content is treated as base64-encoded binary data.

\*/

"use strict";

exports.info = {
	name: "savefieldcontent",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 4) {
		return "Missing parameters";
	}
	var fs = require("fs"),
		path = require("path"),
		wiki = this.commander.wiki,
		filter = this.params[0],
		fieldname = this.params[1],
		pathname = path.resolve(this.commander.outputPath,this.params[2]),
		suffix = this.params[3] || "",
		tiddlers = wiki.filterTiddlers(filter);
	$tw.utils.createDirectory(pathname);
	$tw.utils.each(tiddlers,function(title) {
		var tiddler = wiki.getTiddler(title);
		if(tiddler) {
			var content = tiddler.fields[fieldname];
			if(content) {
				var filename = path.resolve(pathname,$tw.utils.encodeURIComponentExtended(title) + suffix);
				fs.writeFileSync(filename,content,"base64");
			}
		}
	});
	return null;
};

exports.Command = Command;
