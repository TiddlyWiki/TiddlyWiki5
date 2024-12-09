/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/delete-bag-tiddler.js
type: application/javascript
module-type: mws-route

DELETE /bags/:bag_name/tiddler/:title

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var aclMiddleware = require("$:/plugins/tiddlywiki/multiwikiserver/modules/routes/helpers/acl-middleware.js").middleware;

exports.method = "DELETE";

exports.path = /^\/bags\/([^\/]+)\/tiddlers\/(.+)$/;

exports.handler = function(request,response,state) {
	aclMiddleware(request, response, state, "bag", "WRITE");
	// Get the  parameters
	var bag_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		title = $tw.utils.decodeURIComponentSafe(state.params[1]);
	if(bag_name) {
		if(!response.headersSent) {
			var result = $tw.mws.store.deleteTiddler(title,bag_name);
			response.writeHead(204, "OK", {
				"X-Revision-Number": result.tiddler_id.toString(),
				Etag: state.makeTiddlerEtag(result),
				"Content-Type": "text/plain"
			});
			response.end();	
		}
	} else {
		if(!response.headersSent) {
			response.writeHead(404);
			response.end();
		}
	}
};

}());
