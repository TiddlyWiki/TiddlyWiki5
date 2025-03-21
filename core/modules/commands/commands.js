/*\
title: $:/core/modules/commands/commands.js
type: application/javascript
module-type: command

Runs the commands returned from a filter

\*/

"use strict";

exports.info = {
	name: "commands",
	synchronous: true
};

var Command = function(params, commander) {
	this.params = params;
	this.commander = commander;
};

Command.prototype.execute = function() {
	// Parse the filter
	var filter = this.params[0];
	if(!filter) {
		return "No filter specified";
	}
	var commands = this.commander.wiki.filterTiddlers(filter)
	if(commands.length === 0) {
		return "No tiddlers found for filter '" + filter + "'";
	}
	this.commander.addCommandTokens(commands);
	return null;
};

exports.Command = Command;
