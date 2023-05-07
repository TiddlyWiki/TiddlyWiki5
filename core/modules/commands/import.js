/*\
title: $:/core/modules/commands/import.js
type: application/javascript
module-type: command

Command to import tiddlers from a file

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "import",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this,
		fs = require("fs"),
		path = require("path");
	if(this.params.length < 2) {
		return "Missing parameters";
	}
	var filename = self.params[0],
		deserializer = self.params[1],
		title = self.params[2] || filename,
		encoding = self.params[3] || "utf8",
		text = fs.readFileSync(filename,encoding),
		tiddlers = this.commander.wiki.deserializeTiddlers(null,text,{title: title},{deserializer: deserializer});
	$tw.utils.each(tiddlers,function(tiddler) {
		self.commander.wiki.importTiddler(new $tw.Tiddler(tiddler));
	});
	this.commander.log(tiddlers.length + " tiddler(s) imported");
	return null;
};

exports.Command = Command;

})();
