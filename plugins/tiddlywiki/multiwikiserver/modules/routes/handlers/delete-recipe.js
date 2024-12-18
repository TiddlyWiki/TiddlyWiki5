/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/delete-recipe.js
type: application/javascript
module-type: mws-route

DELETE /recipes/:recipe-name

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "DELETE";

exports.path = /^\/recipes\/([^\/]+)$/;

exports.csrfDisable = true;

exports.useACL = true;

exports.entityName = "recipe"

exports.handler = function(request,response,state) {
	const recipeName = state.params[0];
	if(recipeName) {
		const result = $tw.mws.store.deleteRecipe(recipeName);
		if(!result) {
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