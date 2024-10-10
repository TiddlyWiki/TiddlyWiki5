/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/put-recipe-tiddler.js
type: application/javascript
module-type: mws-route

PUT /recipes/:recipe_name/tiddlers/:title

\*/
(function () {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "PUT";

exports.path = /^\/recipes\/([^\/]+)\/tiddlers\/(.+)$/;

exports.useACL = true;

exports.entityName = "recipe"

exports.handler = function (request, response, state) {
	// Get the  parameters
	var recipe_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		title = $tw.utils.decodeURIComponentSafe(state.params[1]),
		fields = $tw.utils.parseJSONSafe(state.data);
	if(recipe_name && title === fields.title) {
		var result = $tw.mws.store.saveRecipeTiddler(fields, recipe_name);
		if(!response.headersSent) {
			if(result) {
				response.writeHead(204, "OK", {
					"X-Revision-Number": result.tiddler_id.toString(),
					"X-Bag-Name": result.bag_name,
					Etag: state.makeTiddlerEtag(result),
					"Content-Type": "text/plain"
				});
			} else {
				response.writeHead(400);
			}
			response.end();
		}
		return;
	}
	// Fail if something went wrong
	if(!response.headersSent) {
		response.writeHead(404);
		response.end();
	}
};

}());
