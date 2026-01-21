/*\
title: $:/core/modules/commands/version.js
type: application/javascript
module-type: command

Version command

\*/

"use strict";

exports.info = {
	name: "version",
	// tells commander that we're done once the execute function returns/resolves
	// otherwise the third constructor parameter is a "next" callback
	synchronous: true
};

var Command = function(params,commander) {
	this.params = params;
	this.commander = commander;
};


Command.prototype.execute = async function() {
	this.commander.streams.output.write($tw.version + "\n");
	// literally just an example
	await Promise.resolve();
	return null; // No error
	// return Promise.resolve(null) // No error
	// return "never" // error
	// throw new Error("never") // error
	// return Promise.resolve("never") // error
	// return Promise.reject(new Error("never")) //error
};

exports.Command = Command;
