/*\
title: $:/plugins/tiddlywiki/multiwikiserver/route-put-recipe-tiddler.js
type: application/javascript
module-type: route

PUT /wikis/:recipe_name/recipes/:recipe_name/tiddlers/:title

NOTE: Urls currently include the recipe name twice. This is temporary to minimise the changes to the TiddlyWeb plugin

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "PUT";

exports.path = /^\/wiki\/([^\/]+)\/recipes\/([^\/]+)\/tiddlers\/(.+)$/;

exports.handler = function(request,response,state) {
	// Get the  parameters
	var recipe_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		recipe_name_2 = $tw.utils.decodeURIComponentSafe(state.params[1]),
		title = $tw.utils.decodeURIComponentSafe(state.params[2]),
		fields = $tw.utils.parseJSONSafe(state.data);
	// Pull up any subfields in the `fields` object
	if(typeof fields.fields === "object") {
		$tw.utils.each(fields.fields,function(field,name) {
			fields[name] = field;
		});
		delete fields.fields;
	}
	// Stringify any array fields
	$tw.utils.each(fields,function(value,name) {
		if($tw.utils.isArray(value)) {
			fields[name] = $tw.utils.stringifyList(value);
		}
	});
	// Require the recipe names to match
	if(recipe_name === recipe_name_2) {
		var result = $tw.mws.store.saveRecipeTiddler(fields,recipe_name);
		if(result) {
			response.writeHead(204, "OK",{
				Etag: "\"" + result.bag_name + "/" + encodeURIComponent(title) + "/" + result.tiddler_id + ":\"",
				"Content-Type": "text/plain"
			});
		} else {
			response.writeHead(400);
		}
		response.end();
		return;
	}
	// Fail if something went wrong
	response.writeHead(404);
	response.end();

};

}());
