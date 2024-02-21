/*\
title: $:/plugins/tiddlywiki/multiwikiserver/route-delete-recipe-tiddler.js
type: application/javascript
module-type: route

DELETE /wikis/:recipe_name/recipes/:bag_name/tiddler/:title

NOTE: Urls currently include the recipe name twice. This is temporary to minimise the changes to the TiddlyWeb plugin

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "DELETE";

exports.path = /^\/wiki\/([^\/]+)\/bags\/([^\/]+)\/tiddlers\/(.+)$/;

exports.handler = function(request,response,state) {
	// Get the  parameters
	var recipe_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		bag_name = $tw.utils.decodeURIComponentSafe(state.params[1]),
		title = $tw.utils.decodeURIComponentSafe(state.params[2]);
	var recipeBags = $tw.mws.store.getRecipeBags(recipe_name);
	if(recipeBags.indexOf(bag_name) !== -1) {
		$tw.mws.store.deleteTiddler(title,bag_name);
		response.writeHead(204, "OK", {
			"Content-Type": "text/plain"
		});
		response.end();	
	} else {
		response.writeHead(404);
		response.end();
	}
};

}());
