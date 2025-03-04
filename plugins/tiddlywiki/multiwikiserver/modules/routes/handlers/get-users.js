/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/get-users.js
type: application/javascript
module-type: mws-route

GET /admin/users

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/admin\/users$/;

exports.handler = function(request,response,state) {
	var userList = state.server.sqlTiddlerDatabase.listUsers();
	if (request.url.includes("*")) {
		$tw.mws.store.adminWiki.deleteTiddler("$:/temp/mws/post-user/error");
		$tw.mws.store.adminWiki.deleteTiddler("$:/temp/mws/post-user/success");
	}

	// Ensure userList is an array
	if (!Array.isArray(userList)) {
		userList = [];
		console.error("userList is not an array");
	}

	if(!state.authenticatedUser.isAdmin && !state.firstGuestUser) {
		response.writeHead(403, "Forbidden", { "Content-Type": "text/plain" });
		response.end("Forbidden");
		return;
	}

	// Convert dates to strings and ensure all necessary fields are present
	userList = userList.map(user => ({
		user_id: user.user_id || '',
		username: user.username || '',
		email: user.email || '',
		created_at: user.created_at ? new Date(user.created_at).toISOString() : '',
		last_login: user.last_login ? new Date(user.last_login).toISOString() : ''
	}));

	response.writeHead(200, "OK", {
		"Content-Type": "text/html"
	});

	// Render the html
	var html = $tw.mws.store.adminWiki.renderTiddler("text/plain","$:/plugins/tiddlywiki/multiwikiserver/templates/page",{
		variables: {
			"page-content": "$:/plugins/tiddlywiki/multiwikiserver/templates/get-users",
			"user-list": JSON.stringify(userList),
			"username": state.authenticatedUser ? state.authenticatedUser.username : state.firstGuestUser ? "Anonymous User" : "Guest",
			"user-is-admin": state.authenticatedUser && state.authenticatedUser.isAdmin ? "yes" : "no",
			"first-guest-user": state.firstGuestUser ? "yes" : "no"
		}
	});
	response.write(html);
	response.end();
};

}());