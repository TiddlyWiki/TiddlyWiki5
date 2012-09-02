/*\
title: $:/core/modules/commands/password.js
type: application/javascript
module-type: command

Save password for crypto operations

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "password",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 1) {
		return "Missing password";
	}
	$tw.crypto.setPassword(this.params[0]);
	return null;
};

exports.Command = Command;

})();
