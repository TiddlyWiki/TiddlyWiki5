/*\
title: $:/core/modules/server/routes/post-actions.js
type: application/javascript
module-type: route

POST /recipes/default/actions

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
	
	// Merge variables: URL parameters take precedence over request body
	var variables = $tw.utils.extend({}, data.variables || {});
	for(var key in state.queryParameters) {
		variables[key] = state.queryParameters[key];
	}
	
	// Create a root widget to execute actions
	var widgetNode = state.wiki.makeWidget(null, {
		document: $tw.fakeDocument,
		variables: variables
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
		widgetNode.invokeActionString(tiddlerText, widgetNode, null, variables);
	}
	// Otherwise use tag
	else if(hasTag) {
		widgetNode.invokeActionsByTag(data.tag, null, variables);
	}
	
	// Return success response
	state.sendResponse(200,{"Content-Type": "application/json"},JSON.stringify({
		success: true
	}),"utf8");
};
