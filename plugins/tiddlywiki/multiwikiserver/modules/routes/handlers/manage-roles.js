/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/manage-roles.js
type: application/javascript
module-type: mws-route

GET /admin/manage-roles

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/admin\/roles\/?$/;

exports.handler = function(request, response, state) {
	var roles = state.server.sqlTiddlerDatabase.listRoles();

	response.writeHead(200, "OK", {"Content-Type": "text/html"});

	var html = $tw.mws.store.adminWiki.renderTiddler("text/plain", "$:/plugins/tiddlywiki/multiwikiserver/templates/page", {
		variables: {
			"page-content": "$:/plugins/tiddlywiki/multiwikiserver/templates/manage-roles",
			"roles-list": JSON.stringify(roles),
			"username": state.authenticatedUser ? state.authenticatedUser.username : "Guest",
			"user-is-admin": state.authenticatedUser && state.authenticatedUser.isAdmin ? "yes" : "no"
		}
	});
	response.write(html);
	response.end();
};

}());