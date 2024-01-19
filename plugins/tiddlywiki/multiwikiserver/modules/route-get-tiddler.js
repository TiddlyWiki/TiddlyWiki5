/*\
title: $:/plugins/tiddlywiki/multiwikiserver/route-get-tiddler.js
type: application/javascript
module-type: route

GET /wikis/:recipe_name/recipes/:recipe_name/tiddler/:title

NOTE: Urls currently include the recipe name twice. This is temporary to minimise the changes to the TiddlyWeb plugin

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/wiki\/([^\/]+)\/recipes\/([^\/]+)\/tiddlers\/([^\/]+)$/;

exports.handler = function(request,response,state) {
	// Get the  parameters
	var recipe_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		recipe_name_2 = $tw.utils.decodeURIComponentSafe(state.params[1]),
		title = $tw.utils.decodeURIComponentSafe(state.params[2]),
		tiddler = recipe_name === recipe_name_2 && $tw.sqlTiddlerStore.getTiddler(title,recipe_name);
	if(recipe_name === recipe_name_2 && tiddler) {
		// If application/json is requested then this is an API request, and gets the response in JSON
		if(request.headers.accept && request.headers.accept.indexOf("application/json") !== -1) {
				var tiddlerFields = {},
				knownFields = [
					"bag", "created", "creator", "modified", "modifier", "permissions", "recipe", "revision", "tags", "text", "title", "type", "uri"
				];
			$tw.utils.each(tiddler,function(value,name) {
				if(knownFields.indexOf(name) !== -1) {
					tiddlerFields[name] = value;
				} else {
					tiddlerFields.fields = tiddlerFields.fields || {};
					tiddlerFields.fields[name] = value;
				}
			});
			tiddlerFields.revision = "0";
			tiddlerFields.bag = "bag-gamma";
			tiddlerFields.type = tiddlerFields.type || "text/vnd.tiddlywiki";
			state.sendResponse(200,{"Content-Type": "application/json"},JSON.stringify(tiddlerFields),"utf8");
		} else {
			// This is not a JSON API request, we should return the raw tiddler content
			var type = tiddler.type || "text/plain";
			response.writeHead(200, "OK",{
				"Content-Type":  type
			});
			response.write(tiddler.text || "",($tw.config.contentTypeInfo[type] ||{encoding: "utf8"}).encoding);
			response.end();;
		}
	} else {
		response.writeHead(404);
		response.end();
	}
};

}());
