/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/get-bag-tiddler.js
type: application/javascript
module-type: mws-route

GET /bags/:bag_name/tiddler/:title

Parameters:

fallback=<url> // Optional redirect if the tiddler is not found

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/bags\/([^\/]+)\/tiddlers\/(.+)$/;

exports.handler = function(request,response,state) {
	// Get the  parameters
	const bag_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		title = $tw.utils.decodeURIComponentSafe(state.params[1]),
		tiddlerInfo = $tw.mws.store.getBagTiddler(title,bag_name);
	if(tiddlerInfo && tiddlerInfo.tiddler) {
		// If application/json is requested then this is an API request, and gets the response in JSON
		if(request.headers.accept && request.headers.accept.indexOf("application/json") !== -1) {
			state.sendResponse(200,{
				Etag: state.makeTiddlerEtag(tiddlerInfo),
				"Content-Type": "application/json"
			},JSON.stringify(tiddlerInfo.tiddler),"utf8");
			return;
		} else {
			// This is not a JSON API request, we should return the raw tiddler content
			const result = $tw.mws.store.getBagTiddlerStream(title,bag_name);
			if(result) {
				response.writeHead(200, "OK",{
					Etag: state.makeTiddlerEtag(result),
					"Content-Type":  result.type
				});
				result.stream.pipe(response);
				return;
			} else {
				response.writeHead(404);
				response.end();
				return;
			}
		}
	} else {
		// Redirect to fallback URL if tiddler not found
		if(state.queryParameters.fallback) {
			response.writeHead(302, "OK",{
				"Location": state.queryParameters.fallback
			});
			response.end();
			return;
		} else {
			response.writeHead(404);
			response.end();
			return;
		}
	}
};

}());
