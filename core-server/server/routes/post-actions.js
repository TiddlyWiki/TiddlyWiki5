/*\
title: $:/core/modules/server/routes/post-actions.js
type: application/javascript
module-type: route

POST /recipes/default/actions

Execute action tiddlers on the server side

Request body should be a JSON object with the following properties:
- tag: (optional) tag name to execute all action tiddlers with this tag
- title: (optional) title of a specific action tiddler to execute
- variables: (optional) object containing variable name-value pairs to set in the execution context

At least one of 'tag' or 'title' must be provided. If both are provided, both will be executed.

Example 1 - Execute by tag:
POST /recipes/default/actions
{
	"tag": "$:/tags/Actions",
	"variables": {
		"currentTiddler": "MyTiddler"
	}
}

Example 2 - Execute by title:
POST /recipes/default/actions
{
	"title": "$:/core/ui/Actions/new-tiddler",
	"variables": {
		"currentTiddler": "MyTiddler"
	}
}

Example 3 - Execute both:
POST /recipes/default/actions
{
	"tag": "$:/tags/Actions",
	"title": "MyCustomAction",
	"variables": {}
}

\*/
"use strict";

exports.methods = ["POST"];

exports.path = /^\/recipes\/default\/actions$/;

exports.info = {
	priority: 100,
	bodyFormat: "application/json"
};

exports.handler = function(request,response,state) {
	var data;
	// Parse request body
	try {
		data = JSON.parse(state.data.toString("utf8"));
	} catch(e) {
		state.sendResponse(400,{"Content-Type": "application/json"},JSON.stringify({
			error: "Invalid JSON in request body"
		}),"utf8");
		return;
	}
	// Validate required fields - need at least one of tag or title
	if(!data.tag && !data.title) {
		state.sendResponse(400,{"Content-Type": "application/json"},JSON.stringify({
			error: "Missing required field: must provide either 'tag' or 'title'"
		}),"utf8");
		return;
	}
	// Create a root widget to execute actions
	var widgetNode = state.wiki.makeWidget(null, {
		document: $tw.fakeDocument
	});
	// Execute action tiddler by title if provided
	if(data.title) {
		var tiddlerText = state.wiki.getTiddlerText(data.title);
		if(tiddlerText) {
			widgetNode.invokeActionString(tiddlerText, widgetNode, null, data.variables || {});
		} else {
			state.sendResponse(404,{"Content-Type": "application/json"},JSON.stringify({
				error: "Action tiddler not found: " + data.title
			}),"utf8");
			return;
		}
	}
	// Execute action tiddlers by tag if provided
	if(data.tag) {
		widgetNode.invokeActionsByTag(data.tag, null, data.variables || {});
	}
	// Return success response
	state.sendResponse(200,{"Content-Type": "application/json"},JSON.stringify({
		success: true
	}),"utf8");
};
