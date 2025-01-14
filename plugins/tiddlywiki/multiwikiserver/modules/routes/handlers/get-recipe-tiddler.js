/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/get-recipe-tiddler.js
type: application/javascript
module-type: mws-route

GET /recipes/:recipe_name/tiddler/:title

Parameters:

fallback=<url> // Optional redirect if the tiddler is not found

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/recipes\/([^\/]+)\/tiddlers\/(.+)$/;

// exports.useACL = true;

exports.entityName = "recipe"
/** @type {ServerRouteHandler<2>} */	
exports.handler = async function(request,response,state) {
	// Get the  parameters
	var recipe_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		title = $tw.utils.decodeURIComponentSafe(state.params[1]),
		tiddlerInfo = await state.store.getRecipeTiddler(title,recipe_name);
	if(tiddlerInfo && tiddlerInfo.tiddler) {
		// If application/json is requested then this is an API request, and gets the response in JSON
		if(request.headers.accept && request.headers.accept.indexOf("application/json") !== -1) {
			state.sendResponse(200,{
				"X-Revision-Number": tiddlerInfo.tiddler_id,
				"X-Bag-Name": tiddlerInfo.bag_name,
				Etag: state.makeTiddlerEtag(tiddlerInfo),
				"Content-Type": "application/json"
			},JSON.stringify(tiddlerInfo.tiddler),"utf8");
			return;
		} else {
			// This is not a JSON API request, we should return the raw tiddler content
			const result = await state.store.getBagTiddlerStream(title,tiddlerInfo.bag_name);
			if(result) {
				if(!response.headersSent){
					response.writeHead(200, "OK",{
						Etag: state.makeTiddlerEtag(result),
						"Content-Type":  result.type
					});
				}
				result.stream.pipe(response);
				return;
			} else {
				if(!response.headersSent){
					response.writeHead(404);
					response.end();
				}
				return;
			}
		}
	} else {
		if(!response.headersSent) {
			// Redirect to fallback URL if tiddler not found
			if(state.queryParameters.get("fallback")) {
				response.writeHead(302, "OK",{
					"Location": state.queryParameters.get("fallback")
				});
				response.end();
				return;
			} else {
				response.writeHead(404);
				response.end();
				return;
			}
		}
		return;
	}
};

}());
