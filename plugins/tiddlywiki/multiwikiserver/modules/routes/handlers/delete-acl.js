/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/delete-acl.js
type: application/javascript
module-type: mws-route

POST /admin/delete-acl

\*/
(function() {

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";


	var aclMiddleware = require("$:/plugins/tiddlywiki/multiwikiserver/routes/helpers/acl-middleware.js").middleware;

	exports.method = "POST";

	exports.path = /^\/admin\/delete-acl\/?$/;


	exports.bodyFormat = "www-form-urlencoded";

	exports.csrfDisable = true;

	/** @type {ServerRouteHandler<0, "www-form-urlencoded">} */
	exports.handler = async function(request, response, state) {
		var sqlTiddlerDatabase = state.store.sql;
		var recipe_name = state.data.get("recipe_name");
		var bag_name = state.data.get("bag_name");
		var acl_id = state.data.get("acl_id");
		var entity_type = state.data.get("entity_type");

		await aclMiddleware(request, response, state, entity_type, "WRITE");
		if(response.headersSent) return;
		
		await sqlTiddlerDatabase.deleteACL(acl_id);

		response.writeHead(302, {"Location": "/admin/acl/" + recipe_name + "/" + bag_name});
		response.end();
	};

}());