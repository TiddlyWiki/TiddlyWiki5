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

If both 'tag' and 'title' are provided, 'title' takes precedence.
At least one of 'tag' or 'title' must be a non-empty string.

Example 1 - Execute by tag:
POST /recipes/default/actions
{
	"tag": "$:/tags/Actions",
	"variables": {
		"currentTiddler": "MyTiddler"
	}
}

Example 2 - Execute by title (takes precedence if both provided):
POST /recipes/default/actions
{
	"title": "$:/core/ui/Actions/new-tiddler",
	"variables": {
		"currentTiddler": "MyTiddler"
	}
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
	
	// Validate required fields - at least one non-empty string
	var hasTitle = data.title && typeof data.title === "string" && data.title.trim() !== "";
	var hasTag = data.tag && typeof data.tag === "string" && data.tag.trim() !== "";
	
	if(!hasTitle && !hasTag) {
		state.sendResponse(400,{"Content-Type": "application/json"},JSON.stringify({
			error: "Missing required field: must provide either 'tag' or 'title' as a non-empty string"
		}),"utf8");
		return;
	}
	
	// Create a root widget to execute actions
	var widgetNode = state.wiki.makeWidget(null, {
		document: $tw.fakeDocument
	});
	
	// Title takes precedence if provided
	if(hasTitle) {
		var tiddlerText = state.wiki.getTiddlerText(data.title);
		if(!tiddlerText) {
			state.sendResponse(404,{"Content-Type": "application/json"},JSON.stringify({
				error: "Tiddler not found: " + data.title
			}),"utf8");
			return;
		}
		widgetNode.invokeActionString(tiddlerText, widgetNode, null, data.variables || {});
	}
	// Otherwise use tag
	else if(hasTag) {
		widgetNode.invokeActionsByTag(data.tag, null, data.variables || {});
	}
	
	// Return success response
	state.sendResponse(200,{"Content-Type": "application/json"},JSON.stringify({
		success: true
	}),"utf8");
};
