/*\
title: $:/core/modules/commands/rendertiddler.js
type: application/javascript
module-type: command

Command to render a tiddler and save it to a file

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "rendertiddler",
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
		filename = path.resolve(this.commander.outputPath,this.params[1]),
		type = this.params[2] || "text/html";
	$tw.utils.createFileDirectories(filename);
	fs.writeFile(filename,this.commander.wiki.renderTiddler(type,title),"utf8",function(err) {
		self.callback(err);
	});
	return null;
};

exports.Command = Command;

})();
