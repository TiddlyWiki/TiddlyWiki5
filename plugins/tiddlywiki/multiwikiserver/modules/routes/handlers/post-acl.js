/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/post-acl.js
type: application/javascript
module-type: mws-route

POST /admin/post-acl

\*/

(function () {
	const {okEntityType, okType} = require("$:/plugins/tiddlywiki/multiwikiserver/store/sql-tiddler-database");
	const {ok} = require("assert");
	
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "POST";

exports.path = /^\/admin\/post-acl\/?$/;

exports.bodyFormat = "www-form-urlencoded";

exports.csrfDisable = true;
/** @type {ServerRouteHandler<0,"www-form-urlencoded">} */	
exports.handler = async function (request, response, state) {
	var sqlTiddlerDatabase = state.store.sql;
	var entity_type = state.data.get("entity_type");
	var recipe_name = state.data.get("recipe_name");
	var bag_name = state.data.get("bag_name");
	var role_id = state.data.get("role_id") ?? "";
	var permission_id = state.data.get("permission_id") ?? "";
	var isRecipe = entity_type === "recipe"

	ok(role_id, "role_id is required");
	ok(permission_id, "permission_id is required");
	okEntityType(entity_type);
	const entity_name = isRecipe ? recipe_name : bag_name;
	okType(entity_name, "string", (isRecipe ? "recipe_name" : "bag_name") + " is required");

	try {
		var entityAclRecords = await sqlTiddlerDatabase.getACLByName(entity_type, entity_name, true);

		var aclExists = entityAclRecords.some((record) => (
			record.role_id == +role_id && record.permission_id == +permission_id
		))

		// This ensures that the user attempting to modify the ACL has permission to do so
		// if(!state.authenticatedUser || (entityAclRecords.length > 0 && !sqlTiddlerDatabase[isRecipe ? 'hasRecipePermission' : 'hasBagPermission'](state.authenticatedUser.user_id, isRecipe ? recipe_name : bag_name, 'WRITE'))){
		// 	response.writeHead(403, "Forbidden");
		// 	response.end();
		// 	return
		// }

		if (aclExists) {
			// do nothing, return the user back to the form
			response.writeHead(302, { "Location": "/admin/acl/" + recipe_name + "/" + bag_name });
			response.end();
			return
		}

		await sqlTiddlerDatabase.createACL(
			entity_name,
			entity_type,
			+role_id,
			+permission_id
		)

		response.writeHead(302, { "Location": "/admin/acl/" + recipe_name + "/" + bag_name });
		response.end();
	} catch (error) {
		response.writeHead(302, { "Location": "/admin/acl/" + recipe_name + "/" + bag_name });
		response.end();
	}
};

}());