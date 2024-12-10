/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/delete-acl.js
type: application/javascript
module-type: mws-route

POST /admin/delete-acl

\*/
(function () {

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	var aclMiddleware = require("$:/plugins/tiddlywiki/multiwikiserver/modules/routes/helpers/acl-middleware.js").middleware;

	exports.method = "POST";

	exports.path = /^\/admin\/delete-acl\/?$/;


	exports.bodyFormat = "www-form-urlencoded";

	exports.csrfDisable = true;

	exports.handler = function (request, response, state) {
		var sqlTiddlerDatabase = state.server.sqlTiddlerDatabase;
		var recipe_name = state.data.recipe_name;
		var bag_name = state.data.bag_name;
		var acl_id = state.data.acl_id;
		var entity_type = state.data.entity_type;

		aclMiddleware(request, response, state, entity_type, "WRITE");

		sqlTiddlerDatabase.deleteACL(acl_id);

		response.writeHead(302, { "Location": "/admin/acl/" + recipe_name + "/" + bag_name });
		response.end();
	};

}());