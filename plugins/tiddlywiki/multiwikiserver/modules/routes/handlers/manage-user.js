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

	// Clean up any existing error/success messages if the user_id is different from the "$:/temp/mws/user-info/preview-user-id"
	var lastPreviewedUser = $tw.wiki.getTiddlerText("$:/temp/mws/user-info/preview-user-id");
	if(user_id !== lastPreviewedUser) {
		$tw.mws.store.adminWiki.deleteTiddler("$:/temp/mws/change-password/error");
		$tw.mws.store.adminWiki.deleteTiddler("$:/temp/mws/change-password/success");
		$tw.mws.store.adminWiki.deleteTiddler("$:/temp/mws/login/error");
		$tw.mws.store.adminWiki.deleteTiddler("$:/temp/mws/delete-user/error");
		$tw.mws.store.adminWiki.deleteTiddler("$:/temp/mws/delete-user/success");
		$tw.mws.store.adminWiki.deleteTiddler("$:/temp/mws/update-profile/error");
		$tw.mws.store.adminWiki.deleteTiddler("$:/temp/mws/update-profile/success");
	}
	
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
	
	// Check if the user is trying to access their own profile or is an admin
	var hasPermission = ($tw.utils.parseInt(user_id, 10) === state.authenticatedUser.user_id) || state.authenticatedUser.isAdmin;
	if(!hasPermission) {
		response.writeHead(403, "Forbidden", { "Content-Type": "text/plain" });
		response.end("Forbidden");
		return;
	}

	// Convert dates to strings and ensure all necessary fields are present
	var user = {
		user_id: userData.user_id || "",
		username: userData.username || "",
		email: userData.email || "",
		created_at: userData.created_at ? new Date(userData.created_at).toISOString() : "",
		last_login: userData.last_login ? new Date(userData.last_login).toISOString() : ""
	};

	// Get all roles which the user has been assigned
	var userRole = state.server.sqlTiddlerDatabase.getUserRoles(user_id);
	var allRoles = state.server.sqlTiddlerDatabase.listRoles();

	// sort allRoles by placing the user's role at the top of the list
	allRoles.sort(function(a, b){ return (a.role_id === userRole?.role_id ? -1 : 1) });

	$tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
		title: "$:/temp/mws/user-info/preview-user-id",
		text: user_id
	}));
	
	response.writeHead(200, "OK", {
		"Content-Type": "text/html"
	});

	// Render the html
	var html = $tw.mws.store.adminWiki.renderTiddler("text/plain", "$:/plugins/tiddlywiki/multiwikiserver/templates/page", {
		variables: {
			"page-content": "$:/plugins/tiddlywiki/multiwikiserver/templates/manage-user",
			"user": JSON.stringify(user),
			"user-initials": user.username.split(" ").map(name => name[0]).join(""),
			"user-role": JSON.stringify(userRole),
			"all-roles": JSON.stringify(allRoles),
			"is-current-user-profile": state.authenticatedUser && state.authenticatedUser.user_id === $tw.utils.parseInt(user_id, 10) ? "yes" : "no",
			"username": state.authenticatedUser ? state.authenticatedUser.username : "Guest",
			"user-is-admin": state.authenticatedUser && state.authenticatedUser.isAdmin ? "yes" : "no"		
		}
	});
	response.write(html);
	response.end();
};

}());