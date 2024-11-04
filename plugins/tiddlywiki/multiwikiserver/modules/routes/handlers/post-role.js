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

	// Add your authentication check here if needed

	sqlTiddlerDatabase.createRole(role_name, role_description);

	response.writeHead(302, { "Location": "/admin/roles" });
	response.end();
};

}());