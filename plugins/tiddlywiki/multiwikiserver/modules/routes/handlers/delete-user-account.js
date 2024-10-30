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
			response.writeHead(403, "Forbidden");
			response.end();
			return;
		}

		// Prevent admin from deleting their own account
		if(state.authenticatedUser.user_id === userId) {
			response.writeHead(400, "Bad Request");
			response.end("Cannot delete your own account");
			return;
		}

		// Check if the user exists
		var user = sqlTiddlerDatabase.getUser(userId);
		if(!user) {
			response.writeHead(404, "Not Found");
			response.end("User not found");
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