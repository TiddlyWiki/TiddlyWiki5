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

var aclMiddleware = require("$:/plugins/tiddlywiki/multiwikiserver/modules/routes/helpers/acl-middleware.js").middleware;

exports.method = "POST";

exports.path = /^\/recipes$/;

exports.bodyFormat = "www-form-urlencoded";

exports.csrfDisable = true;

exports.handler = function(request,response,state) {
	aclMiddleware(request, response, state, "recipe", "WRITE");
	if(state.data.recipe_name && state.data.bag_names) {
		const result = $tw.mws.store.createRecipe(state.data.recipe_name,$tw.utils.parseStringArray(state.data.bag_names),state.data.description);
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
