/*\
title: $:/core/modules/commands/editions.js
type: application/javascript
module-type: command

Command to list the available editions

\*/

"use strict";

exports.info = {
	name: "editions",
	synchronous: true
};

const Command = function(params,commander) {
	this.params = params;
	this.commander = commander;
};

Command.prototype.execute = function() {
	const self = this;
	// Output the list
	this.commander.streams.output.write("Available editions:\n\n");
	const editionInfo = $tw.utils.getEditionInfo();
	$tw.utils.each(editionInfo,(info,name) => {
		self.commander.streams.output.write(`    ${name}: ${info.description}\n`);
	});
	this.commander.streams.output.write("\n");
	return null;
};

exports.Command = Command;
