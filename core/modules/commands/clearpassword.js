/*\
title: $:/core/modules/commands/clearpassword.js
type: application/javascript
module-type: command

Clear password for crypto operations

\*/

"use strict";

exports.info = {
	name: "clearpassword",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	$tw.crypto.setPassword(null);
	return null;
};

exports.Command = Command;
