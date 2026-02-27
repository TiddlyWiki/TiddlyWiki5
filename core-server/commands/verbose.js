/*\
title: $:/core/modules/commands/verbose.js
type: application/javascript
module-type: command

Verbose command

\*/

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
	// Output the boot message log
	this.commander.streams.output.write("Boot log:\n  " + $tw.boot.logMessages.join("\n  ") + "\n");
	return null; // No error
};

exports.Command = Command;
