/*\
title: $:/core/modules/server/routes/post-filter.js
type: application/javascript
module-type: route

POST /recipes/default/filter

\*/
"use strict";
exports.methods = ["POST"];
exports.path = /^\/recipes\/default\/filter$/;
exports.info = {
	priority: 100
};
exports.handler = function(request,response,state) {
	var data = $tw.utils.parseJSONSafe(state.data);
	if(!data) {
		state.sendResponse(400,{"Content-Type": "application/json"},JSON.stringify({
			error: "Invalid JSON in request body"
		}),"utf8");
		return;
	}
	// Require filter field
	if(!data.filter || typeof data.filter !== "string") {
		state.sendResponse(400,{"Content-Type": "application/json"},JSON.stringify({
			error: "Missing or invalid 'filter' field"
		}),"utf8");
		return;
	}
	// Check filter permissions (similar to get-tiddlers-json.js)
	var filter = data.filter;
	if(state.wiki.getTiddlerText("$:/config/Server/AllowAllExternalFilters") !== "yes") {
		if(state.wiki.getTiddlerText("$:/config/Server/ExternalFilters/" + filter) !== "yes") {
			state.sendResponse(403,{"Content-Type": "application/json"},JSON.stringify({
				error: "Forbidden: filter not allowed."
			}),"utf8");
			return;
		}
	}
	try {
		// Merge variables: URL parameters take precedence over request body
		var variables = $tw.utils.extend({}, data.variables || {});
		for(var key in state.queryParameters) {
			variables[key] = state.queryParameters[key];
		}
		
		// Create a fake widget with the provided variables
		var fakeWidget = $tw.rootWidget.makeFakeWidgetWithVariables(variables);
		
		// Create source iterator if source titles are provided
		var source = undefined;
		var sourceTitles = data.source;
		if(sourceTitles && Array.isArray(sourceTitles)) {
			source = state.wiki.makeTiddlerIterator(sourceTitles);
		}

		var results = state.wiki.filterTiddlers(data.filter, fakeWidget, source);
		state.sendResponse(200,{"Content-Type": "application/json"},JSON.stringify({
			results: results
		}),"utf8");
	} catch(error) {
		state.sendResponse(500,{"Content-Type": "application/json"},JSON.stringify({
			error: "Error executing filter",
		}),"utf8");
		// Only log error on server console for security
		console.error("Error executing filter:", error);
	}
};
