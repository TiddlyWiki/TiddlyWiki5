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

exports.method = "DELETE";

exports.path = /^\/bags\/([^\/]+)\/tiddlers\/(.+)$/;

exports.handler = function(request,response,state) {
	// Get the  parameters
	var bag_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		title = $tw.utils.decodeURIComponentSafe(state.params[1]);
	if(bag_name) {
		var result = $tw.mws.store.deleteTiddler(title,bag_name);
		response.writeHead(204, "OK", {
			Etag: "\"tiddler_id:" + result.tiddler_id + "\"",
			"Content-Type": "text/plain"
		});
		response.end();	
	} else {
		response.writeHead(404);
		response.end();
	}
};

}());
