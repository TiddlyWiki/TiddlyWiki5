/*\
title: $:/core/modules/commands/version.js
type: application/javascript
module-type: command

Version command

\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

exports.info = {
	name: "version",
	synchronous: true
}

var Command = function(params,commander) {
	this.params = params;
	this.commander = commander;
};

Command.prototype.execute = function() {
	this.commander.streams.output.write($tw.utils.getVersionString() + "\n");
	return null; // No error
}

exports.Command = Command;

})();
