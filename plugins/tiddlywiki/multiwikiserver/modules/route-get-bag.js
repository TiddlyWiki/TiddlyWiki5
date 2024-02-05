/*\
title: $:/plugins/tiddlywiki/multiwikiserver/route-get-bag.js
type: application/javascript
module-type: route

GET /wikis/:bag_name/bags/:bag_name

NOTE: Urls currently include the bag name twice. This is temporary to minimise the changes to the TiddlyWeb plugin

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/wiki\/([^\/]+)\/bags\/([^\/]+)$/;

exports.handler = function(request,response,state) {
	// Get the  parameters
	var bag_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		bag_name_2 = $tw.utils.decodeURIComponentSafe(state.params[1]),
		titles = bag_name === bag_name_2 && $tw.mws.store.getBagTiddlers(bag_name);
	if(bag_name === bag_name_2 && titles) {
		// If application/json is requested then this is an API request, and gets the response in JSON
		if(request.headers.accept && request.headers.accept.indexOf("application/json") !== -1) {
			state.sendResponse(200,{"Content-Type": "application/json"},JSON.stringify(titles),"utf8");
		} else {
			// This is not a JSON API request, we should return the raw tiddler content
			response.writeHead(200, "OK",{
				"Content-Type":  "text/html"
			});
			// Render the html
			var html = $tw.mws.store.adminWiki.renderTiddler("text/html","$:/plugins/tiddlywiki/multiwikiserver/templates/get-bags",{
				variables: {
					"bag-name": bag_name,
					"bag-titles": JSON.stringify(titles)
				}
			});
			response.write(html);
			response.end();;
		}
	} else {
		response.writeHead(404);
		response.end();
	}
};

}());
