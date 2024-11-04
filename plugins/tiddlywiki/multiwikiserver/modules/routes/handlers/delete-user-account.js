/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/delete-user-account.js
type: application/javascript
module-type: mws-route

POST /delete-user-account

\*/
(function () {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "POST";

exports.path = /^\/delete-user-account\/?$/;

exports.bodyFormat = "www-form-urlencoded";

exports.csrfDisable = true;

exports.handler = function (request, response, state) {
	var sqlTiddlerDatabase = state.server.sqlTiddlerDatabase;
	var userId = state.data.userId;

	// Check if user is admin
	if(!state.authenticatedUser || !state.authenticatedUser.isAdmin) {
		$tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
			title: "$:/temp/mws/delete-user/error",
			text: "You must be an administrator to delete user accounts"
		}));
		response.writeHead(302, { "Location": '/admin/users/'+userId });
		response.end();
		return;
	}

	// Prevent admin from deleting their own account
	if(state.authenticatedUser.user_id === userId) {
		$tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
			title: "$:/temp/mws/delete-user/error",
			text: "Cannot delete your own account"
		}));
		response.writeHead(302, { "Location": '/admin/users/'+userId });
		response.end();
		return;
	}

	// Check if the user exists
	var user = sqlTiddlerDatabase.getUser(userId);
	if(!user) {
		$tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
			title: "$:/temp/mws/delete-user/error",
			text: "User not found"
		}));
		response.writeHead(302, { "Location": '/admin/users/'+userId });
		response.end();
		return;
	}

	// Check if this is the last admin account
	var adminRole = sqlTiddlerDatabase.getRoleByName("ADMIN");
	if(!adminRole) {
		$tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
			title: "$:/temp/mws/delete-user/error",
			text: "Admin role not found"
		}));
		response.writeHead(302, { "Location": '/admin/users/'+userId });
		response.end();
		return;
	}

	var adminUsers = sqlTiddlerDatabase.listUsersByRoleId(adminRole.role_id);
	if(adminUsers.length <= 1 && adminUsers.some(admin => admin.user_id === parseInt(userId))) {
		$tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
			title: "$:/temp/mws/delete-user/error",
			text: "Cannot delete the last admin account"
		}));
		response.writeHead(302, { "Location": '/admin/users/'+userId });
		response.end();
		return;
	}
	
	sqlTiddlerDatabase.deleteUserRolesByUserId(userId);
	sqlTiddlerDatabase.deleteUserSessions(userId);
	sqlTiddlerDatabase.deleteUser(userId);

	// Redirect back to the users management page
	response.writeHead(302, { "Location": "/admin/users" });
	response.end();
};

}()); 