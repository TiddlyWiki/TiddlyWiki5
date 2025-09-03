/*\
title: $:/core/modules/commands/echo.js
type: application/javascript
module-type: command

Command to echo input parameters

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "echo",
	synchronous: true
};

var Command = function(params,commander) {
	this.params = params;
	this.commander = commander;
};

Command.prototype.execute = function() {
	this.commander.streams.output.write(JSON.stringify(this.params,null,4) + "\n");
	return null;
};

exports.Command = Command;

})();
