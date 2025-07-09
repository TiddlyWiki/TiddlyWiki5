/*\
title: $:/core/modules/commands/output.js
type: application/javascript
module-type: command

Command to set the default output location (defaults to current working directory)

\*/

"use strict";

exports.info = {
	name: "output",
	synchronous: true
};

const Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	const fs = require("fs");
	const path = require("path");
	if(this.params.length < 1) {
		return "Missing output path";
	}
	this.commander.outputPath = path.resolve(process.cwd(),this.params[0]);
	return null;
};

exports.Command = Command;
