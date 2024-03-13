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
	// The Node.js docs are unequivocal that exiting in this way can be dangerous because pending I/O is cancelled.
	// It would be better to just stop the server listeners explicitly so that Node.js will exit the process naturally.
	process.exit();
	return null;
};

exports.Command = Command;

})();
