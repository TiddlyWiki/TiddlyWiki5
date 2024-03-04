/*\
title: $:/plugins/tiddlywiki/multiwikiserver/route-get-status.js
type: application/javascript
module-type: route

GET /wiki/:recipe_name/status

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/wiki\/([^\/]+)\/status$/;

exports.handler = function(request,response,state) {
	// Get the recipe name from the parameters
	var recipe_name = $tw.utils.decodeURIComponentSafe(state.params[0]);
	// Compose the response
	var text = JSON.stringify({
		username: "Joe Bloggs",
		anonymous: false,
		read_only: false,
		logout_is_available: false,
		space: {
			recipe: recipe_name
		},
		tiddlywiki_version: $tw.version
	});
	// Send response
	if(text) {
		state.sendResponse(200,{"Content-Type": "application/json"},text,"utf8");
	} else {
		response.writeHead(404);
		response.end();
	}
};

}());
