/*\
title: $:/plugins/tiddlywiki/multiwikiserver/commands/mws-assign-role-permission.js
type: application/javascript
module-type: command

Command to assign permission to a role

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
	
exports.info = {
	name: "mws-assign-role-permission",
	synchronous: false
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = async function() {
	var self = this;

	if(this.params.length < 2) {
		return "Usage: --mws-assign-role-permission <role_name> <permission_name>";
	}

	if(!$tw.mws || !$tw.mws.store || !$tw.mws.store.sqlTiddlerDatabase) {
		return "Error: MultiWikiServer or SQL database not initialized.";
	}

	var role_name = this.params[0];
	var permission_name = this.params[1];
	var role = await $tw.mws.store.sqlTiddlerDatabase.getRoleByName(role_name);
	var permission = await $tw.mws.store.sqlTiddlerDatabase.getPermissionByName(permission_name);
	
	if(!role) {
		return "Error: Unable to find Role: "+role_name;
	}

	if(!permission) {
		return "Error: Unable to find Permission: "+permission_name;
	}

	var permission = await $tw.mws.store.sqlTiddlerDatabase.getPermissionByName(permission_name);


	await $tw.mws.store.sqlTiddlerDatabase.addPermissionToRole(role.role_id, permission.permission_id);
	self.callback();
	return null;
};

exports.Command = Command;

})();