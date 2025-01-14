/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/delete-role.js
type: application/javascript
module-type: mws-route

POST /admin/delete-role

\*/
(function () {

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	exports.method = "POST";

	exports.path = /^\/admin\/delete-role\/?$/;

	exports.bodyFormat = "www-form-urlencoded";

	exports.csrfDisable = true;
	/** @type {ServerRouteHandler<0,"www-form-urlencoded">} */	
	exports.handler = async function (request, response, state) {
		var sqlTiddlerDatabase = state.store.sql;
		var role_id = state.data.get("role_id");

		if(!state.authenticatedUser || !state.authenticatedUser.isAdmin) {
      response.writeHead(403, "Forbidden");
      response.end();
      return;
		}

		// Check if the role exists
		var role = await sqlTiddlerDatabase.getRoleById(role_id);
		if(!role) {
			response.writeHead(404, "Not Found");
			response.end("Role not found");
			return;
		}

		// Check if the role is in use
		var isRoleInUse = await sqlTiddlerDatabase.isRoleInUse(role_id);
		if(isRoleInUse) {
			await sqlTiddlerDatabase.deleteUserRolesByRoleId(role_id);
		}

		// Delete the role
		await sqlTiddlerDatabase.deleteRole(role_id);
		// Redirect back to the roles management page
		response.writeHead(302, { "Location": "/admin/roles" });
		response.end();
	};

}());
