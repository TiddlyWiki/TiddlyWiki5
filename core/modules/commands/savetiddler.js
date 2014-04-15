/*\
title: $:/core/modules/commands/savetiddler.js
type: application/javascript
module-type: command

Command to save the content of a tiddler to a file

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "savetiddler",
	synchronous: false
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 2) {
		return "Missing filename";
	}
	var self = this,
		fs = require("fs"),
		path = require("path"),
		title = this.params[0],
		filename = this.params[1],
		tiddler,
		type,
		contentTypeInfo;

	tiddler = this.commander.wiki.getTiddler(title);
	// Check if tiddler exists. Common user error is a typo
	if(tiddler) {
		type = tiddler.fields.type || "text/vnd.tiddlywiki";
		contentTypeInfo = $tw.config.contentTypeInfo[type] || {encoding: "utf8"};

		fs.writeFile(filename,tiddler.fields.text,contentTypeInfo.encoding,function(err) {
			self.callback(err);
		});
	} else {
		return	"\n-----> Command: --savetiddler " + title +
				"\n-----> Check the tiddler name above" +
				"\n-----> _and_ be sure, that your tiddler exists with this name in your html file!";
	}

	return null;
};

exports.Command = Command;
})();
