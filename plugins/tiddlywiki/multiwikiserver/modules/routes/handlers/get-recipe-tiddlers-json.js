/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/get-recipe-tiddlers-json.js
type: application/javascript
module-type: mws-route

GET /recipes/:recipe_name/tiddlers.json?last_known_tiddler_id=:last_known_tiddler_id&include_deleted=true|false

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/recipes\/([^\/]+)\/tiddlers.json$/;

exports.handler = function(request,response,state) {
	if(!response.headersSent) {
		// Get the  parameters
		var recipe_name = $tw.utils.decodeURIComponentSafe(state.params[0]);
		if(recipe_name) {
			// Get the tiddlers in the recipe, optionally since the specified last known tiddler_id
			var recipeTiddlers = $tw.mws.store.getRecipeTiddlers(recipe_name,{
				include_deleted: state.queryParameters.include_deleted === "true",
				last_known_tiddler_id: state.queryParameters.last_known_tiddler_id
			});
			if(recipeTiddlers) {
				state.sendResponse(200,{"Content-Type": "application/json"},JSON.stringify(recipeTiddlers),"utf8");
				return;
			}
		}
		// Fail if something went wrong
		response.writeHead(404);
		response.end();
	}

};

}());
