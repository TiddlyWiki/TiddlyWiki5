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
	var editRoleId = request.url.includes("?") ? request.url.split("?")[1]?.split("=")[1] : null;
	var editRole = editRoleId ? roles.find(role => role.role_id === $tw.utils.parseInt(editRoleId, 10)) : null;

	if(editRole && editRole.role_name.toLowerCase().includes("admin")) {
		editRole = null;
		editRoleId = null;
	}

	var html = $tw.mws.store.adminWiki.renderTiddler("text/plain", "$:/plugins/tiddlywiki/multiwikiserver/templates/page", {
		variables: {
			"page-content": "$:/plugins/tiddlywiki/multiwikiserver/templates/manage-roles",
			"roles-list": JSON.stringify(roles),
			"edit-role": editRole ? JSON.stringify(editRole) : "",
			"username": state.authenticatedUser ? state.authenticatedUser.username : "Guest",
			"user-is-admin": state.authenticatedUser && state.authenticatedUser.isAdmin ? "yes" : "no"
		}
	});
	response.write(html);
	response.end();
};

}());