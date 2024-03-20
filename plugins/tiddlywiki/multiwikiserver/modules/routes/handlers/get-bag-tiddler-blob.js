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

exports.method = "GET";

exports.path = /^\/bags\/([^\/]+)\/tiddlers\/([^\/]+)\/blob$/;

exports.handler = function(request,response,state) {
	// Get the  parameters
	const bag_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		title = $tw.utils.decodeURIComponentSafe(state.params[1]);
	if(bag_name) {
		const result = $tw.mws.store.getBagTiddlerStream(title,bag_name);
		if(result) {
			response.writeHead(200, "OK",{
				"Content-Type":  result.type
			});
			result.stream.pipe(response);
			return;
		}
	}
	response.writeHead(404);
	response.end();
};

}());
