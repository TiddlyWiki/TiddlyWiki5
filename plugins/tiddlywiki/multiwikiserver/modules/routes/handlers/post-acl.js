/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/post-acl.js
type: application/javascript
module-type: mws-route

POST /admin/post-acl

\*/
(function () {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "POST";

exports.path = /^\/admin\/post-acl\/?$/;

exports.bodyFormat = "www-form-urlencoded";

exports.csrfDisable = true;
/** @type {ServerRouteHandler<0,"www-form-urlencoded">} */	
exports.handler = async function (request, response, state) {
	var sqlTiddlerDatabase = state.store.sqlTiddlerDatabase;
	var entity_type = state.data.entity_type;
	var recipe_name = state.data.recipe_name;
	var bag_name = state.data.bag_name;
	var role_id = state.data.role_id;
	var permission_id = state.data.permission_id;
	var isRecipe = entity_type === "recipe"

	try {
		var entityAclRecords = await sqlTiddlerDatabase.getACLByName(entity_type, isRecipe ? recipe_name : bag_name, true);

		var aclExists = entityAclRecords.some((record) => (
			record.role_id == role_id && record.permission_id == permission_id
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
			isRecipe ? recipe_name : bag_name,
			entity_type,
			role_id,
			permission_id
		)

		response.writeHead(302, { "Location": "/admin/acl/" + recipe_name + "/" + bag_name });
		response.end();
	} catch (error) {
		response.writeHead(302, { "Location": "/admin/acl/" + recipe_name + "/" + bag_name });
		response.end();
	}
};

}());