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
		filename = this.params[1],
		type = this.params[2] || "text/html",
		tiddler;

	tiddler = this.commander.wiki.getTiddler(title);
	// Check if tiddler exists. Common user error is a typo
	if(tiddler) {
		fs.writeFile(filename,this.commander.wiki.renderTiddler(type,title),"utf8",function(err) {
			self.callback(err);
		});
	} else {
		return	"\n-----> Command: --" + exports.info.name + " " + title +
				"\n-----> Check the tiddler name above" +
				"\n-----> _and_ be sure, that your template tiddler exists with this name in your TiddlyWiki!";
	}
	return null;
};

exports.Command = Command;

})();
