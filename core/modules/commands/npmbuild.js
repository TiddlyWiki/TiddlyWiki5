/*\
title: $:/core/modules/commands/npmbuild.js
type: application/javascript
module-type: command

"npmbuild" command is a created it tiddlywiki.js is called with `npm run build`.
`npm run` is used as a "high level" command, that allows the user to test the system with sensible defaults.

Experienced users can use `npm config set` command to create user specifc defaults.
This allows the user to run an eg: different edition, without the need to modify the package.json

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "npmbuild",
	synchronous: true
};

var Command = function(params,commander) {
	this.params = params;
	this.commander = commander;
};

Command.prototype.execute = function() {
	this.commander.streams.output.write("\n--npmbuild command needs to be called with \"npm run build\"\n\tSee the help: TODO!\n");
	return null; // No error
};

exports.Command = Command;

})();
