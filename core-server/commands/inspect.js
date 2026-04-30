/*\
title: $:/core/modules/commands/sandbox.js
type: application/javascript
module-type: command

node.js REPL with access to $tw variable space

Optional params = REPL prompt

\*/

"use strict";

const{ startRepl } = require("$:/core/modules/commands/inspect/repl.js");

exports.info = {
	name: "inspect",
	synchronous: true
};

var Command = function(params,commander,callback) {
	var self = this;
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	this.runtime = startRepl(this);
	return null;
};

exports.Command = Command;