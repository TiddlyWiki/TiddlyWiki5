/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/post-bag-tiddlers.js
type: application/javascript
module-type: route

POST /wiki/:bag_name/bags/:bag_name/tiddlers/
POST /wiki/:bag_name/bags/:bag_name/tiddlers

NOTE: Urls currently include the bag name twice. This is temporary to minimise the changes to the TiddlyWeb plugin

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "POST";

exports.path = /^\/wiki\/([^\/]+)\/bags\/([^\/]+)\/tiddlers\/$/;

exports.bodyFormat = "stream";

exports.csrfDisable = true;

exports.handler = function(request,response,state) {
	const path = require("path"),
		fs = require("fs"),
		processIncomingStream = require("$:/plugins/tiddlywiki/multiwikiserver/routes/helpers/multipart-forms.js").processIncomingStream;
	// Get the  parameters
	var bag_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		bag_name_2 = $tw.utils.decodeURIComponentSafe(state.params[1]);
console.log(`Got ${bag_name} and ${bag_name_2}`)
	// Require the bag names to match
	if(bag_name !== bag_name_2) {
		return state.sendResponse(400,{"Content-Type": "text/plain"},"Bad Request: bag names do not match");
	}
	// Process the incoming data
	processIncomingStream({
		store: $tw.mws.store,
		state: state,
		response: response,
		bagname: bag_name,
		callback: function(err,results) {
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
	});
};

}());
