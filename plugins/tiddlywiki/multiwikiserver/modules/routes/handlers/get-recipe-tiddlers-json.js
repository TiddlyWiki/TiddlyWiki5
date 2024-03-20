/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/get-recipe-tiddlers-json.js
type: application/javascript
module-type: mws-route

GET /recipes/:recipe_name/tiddlers.json?filter=:filter

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/recipes\/([^\/]+)\/tiddlers.json$/;

exports.handler = function(request,response,state) {
	// Get the  parameters
	var recipe_name = $tw.utils.decodeURIComponentSafe(state.params[0]);
	if(recipe_name) {
		// Get the tiddlers in the recipe
		var recipeTiddlers = $tw.mws.store.getRecipeTiddlers(recipe_name);
		// Get a skinny version of each tiddler
		var tiddlers = [];
		$tw.utils.each(recipeTiddlers,function(recipeTiddlerInfo) {
			var tiddlerInfo = $tw.mws.store.getRecipeTiddler(recipeTiddlerInfo.title,recipe_name);
			tiddlers.push(Object.assign({},tiddlerInfo.tiddler,{text: undefined}));
		});
		var text = JSON.stringify(tiddlers);
		state.sendResponse(200,{"Content-Type": "application/json"},text,"utf8");
		return;
	}
	// Fail if something went wrong
	response.writeHead(404);
	response.end();

};

}());
