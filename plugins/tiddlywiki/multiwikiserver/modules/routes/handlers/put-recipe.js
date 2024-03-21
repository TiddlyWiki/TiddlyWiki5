/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/put-recipe.js
type: application/javascript
module-type: mws-route

PUT /recipes/:recipe_name

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "PUT";

exports.path = /^\/recipes\/(.+)$/;

exports.handler = function(request,response,state) {
	// Get the  parameters
	var recipe_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		data = $tw.utils.parseJSONSafe(state.data);
	if(recipe_name && data) {
		const result = $tw.mws.store.createRecipe(recipe_name,data.bag_names,data.description);
		if(!result) {
			state.sendResponse(204,{
				"Content-Type": "text/plain"
			});
		} else {
			state.sendResponse(400,{
				"Content-Type": "text/plain"
			},
			result.message,
			"utf8");
		}
	} else {
		response.writeHead(404);
		response.end();
	}
};

}());
