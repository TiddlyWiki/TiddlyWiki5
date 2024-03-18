/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/get-bag.js
type: application/javascript
module-type: mws-route

GET /wiki/:bag_name/bags/:bag_name/
GET /wiki/:bag_name/bags/:bag_name

NOTE: Urls currently include the bag name twice. This is temporary to minimise the changes to the TiddlyWeb plugin

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/wiki\/([^\/]+)\/bags\/([^\/]+)(\/?)$/;

exports.handler = function(request,response,state) {
	// Redirect if there is no trailing slash. We do this so that the relative URL specified in the upload form works correctly
	if(state.params[2] !== "/") {
		state.redirect(301,state.urlInfo.path + "/");
		return;
	}
	// Get the  parameters
	var bag_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		bag_name_2 = $tw.utils.decodeURIComponentSafe(state.params[1]),
		bagTiddlers = bag_name === bag_name_2 && $tw.mws.store.getBagTiddlers(bag_name);
	if(bag_name === bag_name_2 && bagTiddlers) {
		// If application/json is requested then this is an API request, and gets the response in JSON
		if(request.headers.accept && request.headers.accept.indexOf("application/json") !== -1) {
			state.sendResponse(200,{"Content-Type": "application/json"},JSON.stringify(bagTiddlers),"utf8");
		} else {
			// This is not a JSON API request, we should return the raw tiddler content
			response.writeHead(200, "OK",{
				"Content-Type":  "text/html"
			});
			response.write(`
				<!doctype html>
				<head>
					<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
				</head>
				<body>
			`);
			// Render the html
			var html = $tw.mws.store.adminWiki.renderTiddler("text/html","$:/plugins/tiddlywiki/multiwikiserver/templates/get-bag",{
				variables: {
					"bag-name": bag_name,
					"bag-titles": JSON.stringify(bagTiddlers.map(bagTiddler => bagTiddler.title)),
					"bag-tiddlers": JSON.stringify(bagTiddlers)
				}
			});
			response.write(html);
			response.write(`
				</body>
				</html>
			`);
			response.end();
		}
	} else {
		response.writeHead(404);
		response.end();
	}
};

}());
