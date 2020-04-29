/*\
title: $:/core/modules/commands/load.js
type: application/javascript
module-type: command

Command to load tiddlers from a file or directory

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "load",
	synchronous: false
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
	if(this.params.length < 1) {
		return "Missing filename";
	}
	var tiddlers = $tw.loadTiddlersFromPath(self.params[0]),
		count = 0;
	$tw.utils.each(tiddlers,function(tiddlerInfo) {
		$tw.utils.each(tiddlerInfo.tiddlers,function(tiddler) {
			self.commander.wiki.importTiddler(new $tw.Tiddler(tiddler));
			count++;
		});
	});
	if(!count && self.params[1] !== "noerror") {
		self.callback("No tiddlers found in file \"" + self.params[0] + "\"");
	} else {
		self.callback(null);
	}
	return null;
};

exports.Command = Command;

})();
