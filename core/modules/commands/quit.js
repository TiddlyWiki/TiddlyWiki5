/*\
title: $:/core/modules/commands/quit.js
type: application/javascript
module-type: command

Immediately ends the TiddlyWiki process

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "quit",
	synchronous: true
};

var Command = function(params,commander,callback) {
	var self = this;
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	// Clear any pending commands
	this.commander.clearCommands();
	// We don't actually quit, we just issue the "th-quit" hook to give listeners a chance to exit
	$tw.hooks.invokeHook("th-quit");
	return null;
};

exports.Command = Command;

})();
