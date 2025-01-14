/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/post-recipe.js
type: application/javascript
module-type: mws-route

POST /recipes

Parameters:

recipe_name
description
bag_names: space separated list of bags

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "POST";

exports.path = /^\/recipes$/;

exports.bodyFormat = "www-form-urlencoded";

exports.csrfDisable = true;

exports.useACL = true;

exports.entityName = "recipe"
/** @type {ServerRouteHandler<0,"www-form-urlencoded">} */	
exports.handler = async function(request,response,state) {
	var server = state.server,
		sqlTiddlerDatabase = server.sqlTiddlerDatabase
	if(state.data.get("recipe_name") && state.data.get("bag_names")) {
		const result = await state.store.createRecipe(state.data.get("recipe_name"),$tw.utils.parseStringArray(state.data.get("bag_names")),state.data.get("description"));
		if(!result) {
			if(state.authenticatedUser) {
				await sqlTiddlerDatabase.assignRecipeToUser(state.data.get("recipe_name"),state.authenticatedUser.user_id);
			}
			state.sendResponse(302,{
				"Content-Type": "text/plain",
				"Location": "/"
			});
		} else {
			state.sendResponse(400,{
				"Content-Type": "text/plain"
			},
			result.message,
			"utf8");
		}
	} else {
		state.sendResponse(400,{
			"Content-Type": "text/plain"
		});
	}
};

}());
