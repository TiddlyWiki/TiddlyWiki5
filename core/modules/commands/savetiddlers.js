/*\
title: $:/core/modules/commands/savetiddlers.js
type: application/javascript
module-type: command

Command to save several tiddlers to a folder of files

\*/

"use strict";

const widget = require("$:/core/modules/widgets/widget.js");

exports.info = {
	name: "savetiddlers",
	synchronous: true
};

const Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 1) {
		return "Missing filename";
	}
	const self = this;
	const fs = require("fs");
	const path = require("path");
	const {wiki} = this.commander;
	const filter = this.params[0];
	const pathname = path.resolve(this.commander.outputPath,this.params[1]);
	const deleteDirectory = (this.params[2] || "").toLowerCase() !== "noclean";
	const tiddlers = wiki.filterTiddlers(filter);
	if(deleteDirectory) {
		$tw.utils.deleteDirectory(pathname);
	}
	$tw.utils.createDirectory(pathname);
	$tw.utils.each(tiddlers,(title) => {
		const tiddler = self.commander.wiki.getTiddler(title);
		const type = tiddler.fields.type || "text/vnd.tiddlywiki";
		const contentTypeInfo = $tw.config.contentTypeInfo[type] || {encoding: "utf8"};
		const filename = path.resolve(pathname,$tw.utils.encodeURIComponentExtended(title));
		fs.writeFileSync(filename,tiddler.fields.text || "",contentTypeInfo.encoding);
	});
	return null;
};

exports.Command = Command;
