/*\
title: $:/plugins/tiddlywiki/multiwikiserver/route-get-attachment.js
type: application/javascript
module-type: route

GET /attachments/:recipe_name

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/attachments\/([^\/]+)$/;

exports.handler = function(request,response,state) {
	// Get the attachment name from the parameters
	const attachment_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		attachmentStream = attachment_name && $tw.mws.store.getAttachmentStream(attachment_name);
	// Check request is valid
	if(attachment_name && attachmentStream) {
		// Set the appropriate headers
		response.writeHead(200, "OK", {
			"Content-Type": attachmentStream.type
		});
		// Pipe the file stream to the response
		attachmentStream.stream.pipe(response);
	} else {
		// Not found
		response.writeHead(404,{
			"Content-Type": "text/plain"
		});
		response.end("File not found");
	}
};

}());
