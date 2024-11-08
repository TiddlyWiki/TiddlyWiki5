/*\
title: $:/plugins/tiddlywiki/multiwikiserver/commands/mws-add-user.js
type: application/javascript
module-type: command

Command to create users and grant permission

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
if($tw.node) {
	var crypto = require("crypto");
}
exports.info = {
	name: "mws-add-user",
	synchronous: false
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this;

	if(this.params.length < 2) {
		return "Usage: --mws-add-user <username> <password> [email]";
	}

	if(!$tw.mws || !$tw.mws.store || !$tw.mws.store.sqlTiddlerDatabase) {
		return "Error: MultiWikiServer or SQL database not initialized.";
	}

	var username = this.params[0];
	var password = this.params[1];
	var email = this.params[2] || username + "@example.com";
	var hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

	var user = $tw.mws.store.sqlTiddlerDatabase.getUserByUsername(username);

	if(!user) {
		$tw.mws.store.sqlTiddlerDatabase.createUser(username, email, hashedPassword);
		console.log("User Account Created Successfully with username: " + username + " and password: " + password);
		self.callback();
	}
	return null;
};

exports.Command = Command;

})();