/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/get-bag-tiddler-blob.js
type: application/javascript
module-type: mws-route

GET /bags/:bag_name/tiddler/:title/blob

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var aclMiddleware = require("$:/plugins/tiddlywiki/multiwikiserver/routes/helpers/acl-middleware.js").middleware;

exports.method = "GET";

exports.path = /^\/bags\/([^\/]+)\/tiddlers\/([^\/]+)\/blob$/;
/** @type {ServerRouteHandler<2>} */	
exports.handler = async function(request,response,state) {
	await aclMiddleware(request, response, state, "bag", "READ");
	if(response.headersSent) return;
	// Get the  parameters
	const bag_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		title = $tw.utils.decodeURIComponentSafe(state.params[1]);
	if(bag_name) {
		const result = await state.store.getBagTiddlerStream(title,bag_name);
		if(result && !response.headersSent) {
			response.writeHead(200, "OK",{
				Etag: state.makeTiddlerEtag(result),
				"Content-Type":  result.type,
			});
			result.stream.pipe(response);
			return;
		}
	}
	if (!response.headersSent) {
		response.writeHead(404);
		response.end();
	}
};

}());
