/*\
title: $:/core/modules/commands/build.js
type: application/javascript
module-type: command

Command to build a build target

\*/

"use strict";

exports.info = {
	name: "build",
	synchronous: true
};

const Command = function(params,commander) {
	this.params = params;
	this.commander = commander;
};

Command.prototype.execute = function() {
	// Get the build targets defined in the wiki
	const buildTargets = $tw.boot.wikiInfo && $tw.boot.wikiInfo.build;
	if(!buildTargets) {
		return "No build targets defined";
	}
	// Loop through each of the specified targets
	let targets;
	if(this.params.length > 0) {
		targets = this.params;
	} else {
		targets = Object.keys(buildTargets);
	}
	for(let targetIndex = 0;targetIndex < targets.length;targetIndex++) {
		const target = targets[targetIndex];
		const commands = buildTargets[target];
		if(!commands) {
			return `Build target '${target}' not found`;
		}
		// Add the commands to the queue
		this.commander.addCommandTokens(commands);
	}
	return null;
};

exports.Command = Command;
