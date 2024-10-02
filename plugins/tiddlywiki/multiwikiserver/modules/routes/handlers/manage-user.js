/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/manage-user.js
type: application/javascript
module-type: mws-route

GET /admin/users/:user_id

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/admin\/users\/([^\/]+)\/?$/;


exports.handler = function(request,response,state) {
	var user_id = $tw.utils.decodeURIComponentSafe(state.params[0]);
	var userData = state.server.sqlTiddlerDatabase.getUser(user_id);
	
	if(!userData) {
		response.writeHead(404, "Not Found", {"Content-Type": "text/html"});
		var errorHtml = $tw.mws.store.adminWiki.renderTiddler("text/plain", "$:/plugins/tiddlywiki/multiwikiserver/templates/error", {
			variables: {
				"error-message": "User not found"
			}
		});
		response.write(errorHtml);
		response.end();
		return;
	}
	
	// Convert dates to strings and ensure all necessary fields are present
	const user = {
		user_id: userData.user_id || '',
		username: userData.username || '',
		email: userData.email || '',
		created_at: userData.created_at ? new Date(userData.created_at).toISOString() : '',
		last_login: userData.last_login ? new Date(userData.last_login).toISOString() : ''
	};

	// Get all roles which the user has been assigned
	var userRoles = state.server.sqlTiddlerDatabase.getUserRoles(user_id);
	var allRoles = state.server.sqlTiddlerDatabase.listRoles();
	
	response.writeHead(200, "OK", {
		"Content-Type": "text/html"
	});

	// Render the html
	var html = $tw.mws.store.adminWiki.renderTiddler("text/plain", "$:/plugins/tiddlywiki/multiwikiserver/templates/page", {
		variables: {
			"page-content": "$:/plugins/tiddlywiki/multiwikiserver/templates/manage-user",
			"user": JSON.stringify(user),
			"user-roles": JSON.stringify(userRoles),
			"all-roles": JSON.stringify(allRoles),
			"username": state.authenticatedUser ? state.authenticatedUser.username : "Guest",
			"user-is-admin": state.authenticatedUser && state.authenticatedUser.isAdmin ? "yes" : "no"		
		}
	});
	response.write(html);
	response.end();
};

}());