/*\
title: $:/core/modules/commands/npm_serve.js
type: application/javascript
module-type: command

Version command

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "npm_serve",
	synchronous: true
};

var Command = function(params,commander) {
	this.params = params;
	this.commander = commander;
};

Command.prototype.execute = function() {
	this.commander.streams.output.write("\n--npm_serve command needs to be called with \"npm start\"\n\tSee the help!\n");
	return null; // No error
};

exports.Command = Command;

})();
