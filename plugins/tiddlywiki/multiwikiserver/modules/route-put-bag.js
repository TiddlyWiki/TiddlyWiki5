/*\
title: $:/plugins/tiddlywiki/multiwikiserver/route-put-bag.js
type: application/javascript
module-type: route

PUT /wikis/:bag_name/bags/:bag_name

NOTE: Urls currently include the bag name twice. This is temporary to minimise the changes to the TiddlyWeb plugin

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "PUT";

exports.path = /^\/wiki\/([^\/]+)\/bags\/(.+)$/;

exports.handler = function(request,response,state) {
	// Get the  parameters
	var bag_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		bag_name_2 = $tw.utils.decodeURIComponentSafe(state.params[1]),
		data = $tw.utils.parseJSONSafe(state.data);
	if(bag_name === bag_name_2 && data) {
		const result = $tw.mws.store.createBag(bag_name,data.description);
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
