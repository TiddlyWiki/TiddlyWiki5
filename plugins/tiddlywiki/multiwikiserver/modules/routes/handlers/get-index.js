/* eslint-disable implicit-arrow-linebreak */
/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/get-index.js
type: application/javascript
module-type: mws-route

GET /?show_system=true

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/$/;
/** @type {ServerRouteHandler<0>} */	
exports.handler = async function(request,response,state) {
	// Get the bag and recipe information
	var bagList = await state.store.listBags(),
		recipeList = await state.store.listRecipes();

	// If application/json is requested then this is an API request, and gets the response in JSON
	if(request.headers.accept && request.headers.accept.indexOf("application/json") !== -1) {
		state.sendResponse(200,{"Content-Type": "application/json"},JSON.stringify(recipeList),"utf8");
	} else {
		// This is not a JSON API request, we should return the raw tiddler content
		response.writeHead(200, "OK",{
			"Content-Type":  "text/html"
		});
		// filter bags and recipies by user's read access from ACL
		const allowedRecipes =await filterAsync(recipeList, async recipe =>
			recipe.recipe_name.startsWith("$:/")
			|| state.authenticatedUser?.isAdmin
			|| await state.store.sql.hasRecipePermission(
				state.authenticatedUser?.user_id,
				recipe.recipe_name,
				'READ'
			)
			|| state.allowAnon && state.allowAnonReads
		);

		const allowedBags = await filterAsync(bagList, async bag =>
			bag.bag_name.startsWith("$:/")
			|| state.authenticatedUser?.isAdmin
			|| await state.store.sql.hasBagPermission(
				state.authenticatedUser?.user_id,
				bag.bag_name,
				'READ'
			)
			|| state.allowAnon && state.allowAnonReads
		);

		const allowedRecipesWithWrite =  await mapAsync(allowedRecipes, async recipe => ({
			...recipe,
			has_acl_access: state.authenticatedUser?.isAdmin
				|| recipe.owner_id === state.authenticatedUser?.user_id
				|| await state.store.sql.hasRecipePermission(
					state.authenticatedUser?.user_id, recipe.recipe_name, 'WRITE')
		}))

		// Render the html
		var html = state.store.adminWiki.renderTiddler("text/plain","$:/plugins/tiddlywiki/multiwikiserver/templates/page",{
			variables: {
				"show-system": state.queryParameters.get("show_system") || "off",
				"page-content": "$:/plugins/tiddlywiki/multiwikiserver/templates/get-index",
				"bag-list": JSON.stringify(allowedBags),
				"recipe-list": JSON.stringify(allowedRecipesWithWrite),
				"username": state.authenticatedUser ? state.authenticatedUser.username : state.firstGuestUser ? "Anonymous User" : "Guest",
				"user-is-admin": state.authenticatedUser && state.authenticatedUser.isAdmin ? "yes" : "no",
				"first-guest-user": state.firstGuestUser ? "yes" : "no",
				"show-anon-config": state.showAnonConfig ? "yes" : "no",
				"user-is-logged-in": !!state.authenticatedUser ? "yes" : "no",
				"user": JSON.stringify(state.authenticatedUser),
				"has-profile-access": !!state.authenticatedUser ? "yes" : "no"
			}});
		response.write(html);
		response.end();
	}
};
/**
 * @template T
 * @template U
 * @template V
 * @param {T[]} array 
 * @param {(this: V, value: T, index: number, array: T[]) => U} callback 
 * @param {V} [thisArg]
 * @returns {Promise<U[]>}
 */
async function mapAsync (array, callback, thisArg) {
	const results = new Array(array.length);
	for (let index = 0; index < array.length; index++) {
		results[index] = await callback.call(thisArg, array[index], index, array);
	}
	return results;
};
/**
 * @template T
 * @template U
 * @param {T[]} array
 * @param {(this: U, value: T, index: number, array: T[]) => Promise<boolean>} callback
 * @param {U} [thisArg]
 * @returns {Promise<T[]>}
 */
async function filterAsync (array, callback, thisArg) {
	const results = [];
	for (let index = 0; index < array.length; index++) {
		if (await callback.call(thisArg, array[index], index, array)) {
			results.push(array[index]);
		}
	}
	return results;
}

}());
