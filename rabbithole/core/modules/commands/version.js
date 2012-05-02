/*\
title: $:/core/commands/version.js
type: application/javascript
module-type: command


\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

exports.info = {
	name: "version",
	synchronous: true,
	params: {}
}

var Command = function(params,commander) {
	this.params = params;
	this.commander = commander;
};

Command.prototype.execute = function() {
	this.commander.streams.output.write($tw.utils.getVersionString() + "\n");
}

exports.Command = Command;

})();
