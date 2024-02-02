/*\
title: $:/plugins/tiddlywiki/multiwikiserver/route-post-recipe-tiddlers.js
type: application/javascript
module-type: route

POST /wikis/:recipe_name/recipes/:recipe_name/tiddlers

NOTE: Urls currently include the recipe name twice. This is temporary to minimise the changes to the TiddlyWeb plugin

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "POST";

exports.path = /^\/wiki\/([^\/]+)\/recipes\/([^\/]+)\/tiddlers$/;

exports.bodyFormat = "stream";

exports.handler = function(request,response,state) {
	const fs = require("fs");
	// Get the  parameters
	var recipe_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		recipe_name_2 = $tw.utils.decodeURIComponentSafe(state.params[1]);
console.log(`Got to here ${recipe_name} and ${recipe_name_2}`)
	// Require the recipe names to match
	if(recipe_name !== recipe_name_2) {
		return state.sendResponse(400,{"Content-Type": "text/plain"},"Bad Request: recipe names do not match");
	}
	// Process the incoming data
	let fileStream = null;
	let fieldValue = "";
	state.streamMultipartData({
		cbPartStart: function(headers,name,filename) {
			console.log(`Received file ${name} and ${filename} with ${JSON.stringify(headers)}`)
			if(filename) {
				fileStream = fs.createWriteStream(filename);
			} else {
				fieldValue = "";
			}
		},
		cbPartChunk: function(chunk) {
			if(fileStream) {
				fileStream.write(chunk);
			} else {
				fieldValue = fieldValue + chunk;
			}
		},
		cbPartEnd: function() {
			if(fileStream) {
				fileStream.end();
				fileStream = null;
			} else {
				console.log("Data was " + fieldValue);
				fieldValue = "";
			}
		},
		cbFinished: function(err) {
			if(err) {
				state.sendResponse(400,{"Content-Type": "text/plain"},"Bad Request: " + err);
			} else {
				state.sendResponse(200, {"Content-Type": "text/plain"},"Multipart data processed");
			}
		}
	});
};

}());
