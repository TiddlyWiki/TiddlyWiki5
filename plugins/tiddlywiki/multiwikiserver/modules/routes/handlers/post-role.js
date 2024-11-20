/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/post-role.js
type: application/javascript
module-type: mws-route

POST /admin/post-role

\*/
(function () {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "POST";

exports.path = /^\/admin\/post-role\/?$/;

exports.bodyFormat = "www-form-urlencoded";

exports.csrfDisable = true;

exports.handler = function (request, response, state) {
	var sqlTiddlerDatabase = state.server.sqlTiddlerDatabase;
	var role_name = state.data.role_name;
	var role_description = state.data.role_description;

	if(!state.authenticatedUser || !state.authenticatedUser.isAdmin) {
		$tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
			title: "$:/temp/mws/post-role/error",
			text: "Unauthorized access. Admin privileges required."
		}));
		response.writeHead(302, { "Location": "/login" });
		response.end();
		return;
	}

	if(!role_name || !role_description) {
		$tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
			title: "$:/temp/mws/post-role/error",
			text: "Role name and description are required"
		}));
		response.writeHead(302, { "Location": "/admin/roles" });
		response.end();
		return;
	}

	try {
		// Check if role already exists
		var existingRole = sqlTiddlerDatabase.getRole(role_name);
		if(existingRole) {
			$tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
				title: "$:/temp/mws/post-role/error",
				text: "Role already exists"
			}));
			response.writeHead(302, { "Location": "/admin/roles" });
			response.end();
			return;
		}

		sqlTiddlerDatabase.createRole(role_name, role_description);

		$tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
			title: "$:/temp/mws/post-role/success",
			text: "Role created successfully"
		}));
		response.writeHead(302, { "Location": "/admin/roles" });
		response.end();

	} catch(error) {
		console.error("Error creating role:", error);
		$tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
			title: "$:/temp/mws/post-role/error",
			text: "Error creating role: " + error.message
		}));
		response.writeHead(302, { "Location": "/admin/roles" });
		response.end();
		return;
	}
};

}());