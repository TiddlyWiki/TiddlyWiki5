/*\
title: $:/plugins/tiddlywiki/multiwikiserver/route-put-recipe.js
type: application/javascript
module-type: route

PUT /wikis/:recipe_name/recipes/:recipe_name

NOTE: Urls currently include the recipe name twice. This is temporary to minimise the changes to the TiddlyWeb plugin

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "PUT";

exports.path = /^\/wiki\/([^\/]+)\/recipes\/([^\/]+)$/;

exports.handler = function(request,response,state) {
	// Get the  parameters
	var recipe_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		recipe_name_2 = $tw.utils.decodeURIComponentSafe(state.params[1]);
	if(recipe_name === recipe_name_2) {
		$tw.sqlTiddlerStore.createRecipe(recipe_name);
		state.sendResponse(204,{
			"Content-Type": "text/plain"
		});
	} else {
		response.writeHead(404);
		response.end();
	}
};

}());
