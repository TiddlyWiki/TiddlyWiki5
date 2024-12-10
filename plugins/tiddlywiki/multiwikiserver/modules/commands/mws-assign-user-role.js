/*\
title: $:/plugins/tiddlywiki/multiwikiserver/commands/mws-assign-user-role.js
type: application/javascript
module-type: command

Command to assign a role to a user

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
	
exports.info = {
	name: "mws-assign-user-role",
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
		return "Usage: --mws-assign-user-role <username> <role_name>";
	}

	if(!$tw.mws || !$tw.mws.store || !$tw.mws.store.sqlTiddlerDatabase) {
		return "Error: MultiWikiServer or SQL database not initialized.";
	}

	var username = this.params[0];
	var role_name = this.params[1];
	var role = $tw.mws.store.sqlTiddlerDatabase.getRoleByName(role_name);
	var user = $tw.mws.store.sqlTiddlerDatabase.getUserByUsername(username);
	
	if(!role) {
		return "Error: Unable to find Role: "+role_name;
	}

	if(!user) {
		return "Error: Unable to find user with the username "+username;
	}

	$tw.mws.store.sqlTiddlerDatabase.addRoleToUser(user.user_id, role.role_id);

	console.log(role_name+" role has been assigned to user with username "+username)
	self.callback();
	return null;
};

exports.Command = Command;

})();