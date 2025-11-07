/*\
title: $:/core/modules/server/routes/post-filter.js
type: application/javascript
module-type: route
POST /recipes/default/filter
Execute a filter expression with optional variable context
Request body should be a JSON object with the following properties:
- filter: string containing the filter expression to execute
- variables: optional object containing variable name-value pairs to set in the execution context
- source: optional array of tiddler titles to use as the source (if omitted, uses all tiddlers)
Example:
POST /recipes/default/filter
{
	"filter": "[tag<myTag>sort[title]]",
	"variables": {
		"currentTiddler": "MyTiddler",
		"myTag": "Journal"
	},
	"source": ["Tiddler1", "Tiddler2"]
}
Response will be a JSON array of tiddler titles that match the filter.
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
		// Create a fake widget with the provided variables, then render the widget (required for proper initialization)
		var parser = state.wiki.parseText("text/vnd.tiddlywiki", "", {
			document: $tw.fakeDocument
		});
		var widgetNode = state.wiki.makeWidget(parser, {
			document: $tw.fakeDocument,
			variables: data.variables || {}
		});
		var container = $tw.fakeDocument.createElement("div");
		widgetNode.render(container, null);
		// Create source iterator if source titles are provided
		var source = undefined;
		var sourceTitles = data.source;
		if(sourceTitles && Array.isArray(sourceTitles)) {
			source = state.wiki.makeTiddlerIterator(sourceTitles);
		}

		var results = state.wiki.filterTiddlers(data.filter, widgetNode, source);
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
