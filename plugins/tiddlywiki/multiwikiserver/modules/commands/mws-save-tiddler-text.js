/*\
title: $:/plugins/tiddlywiki/multiwikiserver/commands/mws-save-tiddler-text.js
type: application/javascript
module-type: command

Command to load archive of recipes, bags and tiddlers from a directory

--mws-save-tiddler-text <bag-name> <tiddler-title> <tiddler-text>

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "mws-save-tiddler-text",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this;
	// Check parameters
	if(this.params.length < 3) {
		return "Missing parameters";
	}
	var bagName = this.params[0],
		tiddlerTitle = this.params[1],
		tiddlerText = this.params[2];
	// Save tiddler
	$tw.mws.store.saveBagTiddler({title: tiddlerTitle,text: tiddlerText},bagName);
	return null;
};

exports.Command = Command;

})();
