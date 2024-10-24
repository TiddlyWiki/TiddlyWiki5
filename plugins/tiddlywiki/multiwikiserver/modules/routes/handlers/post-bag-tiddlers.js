/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/post-bag-tiddlers.js
type: application/javascript
module-type: mws-route

POST /bags/:bag_name/tiddlers/

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "POST";

exports.path = /^\/bags\/([^\/]+)\/tiddlers\/$/;

exports.bodyFormat = "stream";

exports.csrfDisable = true;

exports.handler = function(request,response,state) {
	const path = require("path"),
		fs = require("fs"),
		processIncomingStream = require("$:/plugins/tiddlywiki/multiwikiserver/routes/helpers/multipart-forms.js").processIncomingStream;
	// Get the  parameters
	var bag_name = $tw.utils.decodeURIComponentSafe(state.params[0]);
	// Process the incoming data
	processIncomingStream({
		store: $tw.mws.store,
		state: state,
		response: response,
		bag_name: bag_name,
		callback: function(err,results) {
			// If application/json is requested then this is an API request, and gets the response in JSON
			if(request.headers.accept && request.headers.accept.indexOf("application/json") !== -1) {
				state.sendResponse(200,{"Content-Type": "application/json"},JSON.stringify({
					"imported-tiddlers": results
				}));
			} else {
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
				var html = $tw.mws.store.adminWiki.renderTiddler("text/html","$:/plugins/tiddlywiki/multiwikiserver/templates/post-bag-tiddlers",{
					variables: {
						"bag-name": bag_name,
						"imported-titles": JSON.stringify(results)
					}
				});
				response.write(html);
				response.write(`
					</body>
					</html>
				`);
				response.end();
			}
		}
	});
};

}());
