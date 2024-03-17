/*\
title: $:/plugins/tiddlywiki/multiwikiserver/commands/mws-load-tiddlers.js
type: application/javascript
module-type: command

Command to recursively load a directory of tiddler files into a bag

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "mws-load-tiddlers",
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
	if(this.params.length < 2) {
		return "Missing pathname and/or bag name";
	}
	var tiddlersPath = this.params[0],
		bagName = this.params[1];
	$tw.mws.store.saveTiddlersFromPath(tiddlersPath,bagName);
	return null;
};

exports.Command = Command;

})();
