/*\
title: $:/core/modules/startup/commands.js
type: application/javascript
module-type: startup

Command processing

\*/

"use strict";

// Export name and synchronous status
exports.name = "commands";
exports.platforms = ["node"];
exports.after = ["story"];
exports.synchronous = false;

exports.startup = function(callback) {
	// On the server, start a commander with the command line arguments
	const commander = new $tw.Commander(
		$tw.boot.argv,
		((err) => {
			if(err) {
				return $tw.utils.error(`Error: ${err}`);
			}
			callback();
		}),
		$tw.wiki,
		{output: process.stdout,error: process.stderr}
	);
	commander.execute();
};
