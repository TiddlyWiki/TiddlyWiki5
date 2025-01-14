/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/get-acl.js
type: application/javascript
module-type: mws-route

GET /admin/acl

\*/
(function () {
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/admin\/acl\/(.+)$/;
/** @type {ServerRouteHandler<1>} */	
exports.handler = async function (request, response, state) {
	var sqlTiddlerDatabase = state.store.sql;
	var params = state.params[0].split("/")
	var recipeName = params[0];
	var bagName = params[params.length - 1];

	var recipes = await sqlTiddlerDatabase.listRecipes()
	var bags = await sqlTiddlerDatabase.listBags()

	var recipe = recipes.find((entry) => entry.recipe_name === recipeName && entry.bag_names.includes(bagName))
	var bag = bags.find((entry) => entry.bag_name === bagName);

	if (!recipe || !bag) {
		response.writeHead(500, "Unable to handle request", { "Content-Type": "text/html" });
		response.end();
		return;
	}

	var recipeAclRecords = await sqlTiddlerDatabase.getEntityAclRecords(recipe.recipe_name);
	var bagAclRecords = await sqlTiddlerDatabase.getEntityAclRecords(bag.bag_name);
	var roles = await state.store.sql.listRoles();
	var permissions = await state.store.sql.listPermissions();

	// This ensures that the user attempting to view the ACL management page has permission to do so
	async function canContinue() {
		if(state.firstGuestUser) return true;
		if(!state.authenticatedUser) return false;
		if(state.authenticatedUser.isAdmin) return true;
		if(recipeAclRecords.length === 0) return false;
		return await sqlTiddlerDatabase.hasRecipePermission(
			state.authenticatedUser.user_id, recipeName, "WRITE");
	}

	if(!await canContinue())
	{
		response.writeHead(403, "Forbidden");
		response.end();
		return
	}

	// Enhance ACL records with role and permission details
	recipeAclRecords = recipeAclRecords.map(record => {
		var role = roles.find(role => role.role_id === record.role_id);
		if(!role) $tw.utils.warning("Role not found for record " + record.acl_id);
		var permission = permissions.find(perm => perm.permission_id === record.permission_id);
		if(!permission) $tw.utils.warning("Permission not found for record " + record.acl_id);
		return ({
			...record,
			role,
			permission,
			role_name: role?.role_name,
			role_description: role?.description,
			permission_name: permission?.permission_name,
			permission_description: permission?.description
		})
	});

	bagAclRecords = bagAclRecords.map(record => {
		var role = roles.find(role => role.role_id === record.role_id);
		if(!role) $tw.utils.warning("Role not found for record " + record.acl_id);
		var permission = permissions.find(perm => perm.permission_id === record.permission_id);
		if(!permission) $tw.utils.warning("Permission not found for record " + record.acl_id);
		return ({
			...record,
			role,
			permission,
			role_name: role?.role_name,
			role_description: role?.description,
			permission_name: permission?.permission_name,
			permission_description: permission?.description
		})
	});

	response.writeHead(200, "OK", { "Content-Type": "text/html" });

	var html = state.store.adminWiki.renderTiddler("text/plain", "$:/plugins/tiddlywiki/multiwikiserver/templates/page", {
		variables: {
			"page-content": "$:/plugins/tiddlywiki/multiwikiserver/templates/manage-acl",
			"roles-list": JSON.stringify(roles),
			"permissions-list": JSON.stringify(permissions),
			"bag": JSON.stringify(bag),
			"recipe": JSON.stringify(recipe),
			"recipe-acl-records": JSON.stringify(recipeAclRecords),
			"bag-acl-records": JSON.stringify(bagAclRecords),
			"username": state.authenticatedUser ? state.authenticatedUser.username : state.firstGuestUser ? "Anonymous User" : "Guest",
			"user-is-admin": state.authenticatedUser && state.authenticatedUser.isAdmin ? "yes" : "no"
		}
	});

	response.write(html);
	response.end();
};

}());