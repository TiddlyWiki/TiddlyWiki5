/*\
title: $:/core/modules/commands/savetiddlers.js
type: application/javascript
module-type: command

Command to save several tiddlers to a folder of files

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var widget = require("$:/core/modules/widgets/widget.js");

exports.info = {
	name: "savetiddlers",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 1) {
		return "Missing filename";
	}
	var self = this,
		fs = require("fs"),
		path = require("path"),
		wiki = this.commander.wiki,
		filter = this.params[0],
		pathname = path.resolve(this.commander.outputPath,this.params[1]),
		tiddlers = wiki.filterTiddlers(filter);
	$tw.utils.deleteDirectory(pathname);
	$tw.utils.createDirectory(pathname);
	$tw.utils.each(tiddlers,function(title) {
		var tiddler = self.commander.wiki.getTiddler(title),
			type = tiddler.fields.type || "text/vnd.tiddlywiki",
			contentTypeInfo = $tw.config.contentTypeInfo[type] || {encoding: "utf8"},
			filename = path.resolve(pathname,encodeURIComponent(title));
		fs.writeFileSync(filename,tiddler.fields.text,contentTypeInfo.encoding);
	});
	return null;
};

exports.Command = Command;

})();
