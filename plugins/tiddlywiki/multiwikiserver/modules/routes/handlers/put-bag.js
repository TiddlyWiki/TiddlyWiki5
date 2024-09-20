/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/put-bag.js
type: application/javascript
module-type: mws-route

PUT /bags/:bag_name

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var aclMiddleware = require("$:/plugins/tiddlywiki/multiwikiserver/modules/routes/helpers/acl-middleware.js").middleware;

exports.method = "PUT";

exports.path = /^\/bags\/(.+)$/;

exports.handler = function(request,response,state) {
	aclMiddleware(request, response, state, "bag", "WRITE");
	// Get the  parameters
	var bag_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		data = $tw.utils.parseJSONSafe(state.data);
	if(bag_name && data) {
		var result = $tw.mws.store.createBag(bag_name,data.description);
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
		if(!response.headersSent) {
			response.writeHead(404);
			response.end();
		}
	}
};

}());
