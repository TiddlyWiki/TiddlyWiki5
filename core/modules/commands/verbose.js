/*\
title: $:/core/modules/commands/verbose.js
type: application/javascript
module-type: command

Verbose command

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "verbose",
	synchronous: true
};

var Command = function(params,commander) {
	this.params = params;
	this.commander = commander;
};

Command.prototype.execute = function() {
	this.commander.verbose = true;
	return null; // No error
};

exports.Command = Command;

})();
