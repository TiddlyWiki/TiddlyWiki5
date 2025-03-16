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

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var fs = require("fs"),
		path = require("path");
	if(this.params.length < 1) {
		return "Missing output path";
	}
	this.commander.outputPath = path.resolve(process.cwd(),this.params[0]);
	return null;
};

exports.Command = Command;
