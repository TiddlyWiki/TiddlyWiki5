/*\
title: $:/core/modules/server/routes/get-tiddler-html.js
type: application/javascript
module-type: route

GET /:title

\*/
"use strict";

exports.methods = ["GET"];

exports.path = /^\/([^\/]+)$/;

exports.info = {
	priority: 100
};

exports.handler = function(request,response,state) {
	var title = $tw.utils.decodeURIComponentSafe(state.params[0]),
		tiddler = state.wiki.getTiddler(title);
	if(tiddler) {
		var renderType = tiddler.getFieldString("_render_type"),
			renderTemplate = tiddler.getFieldString("_render_template");
		// Tiddler fields '_render_type' and '_render_template' overwrite
		// system wide settings for render type and template
		if(state.wiki.isSystemTiddler(title)) {
			renderType = renderType || state.server.get("system-tiddler-render-type");
			renderTemplate = renderTemplate || state.server.get("system-tiddler-render-template");
		} else {
			renderType = renderType || state.server.get("tiddler-render-type");
			renderTemplate = renderTemplate || state.server.get("tiddler-render-template");
		}
		// Merge variables: default currentTiddler, URL query parameters take precedence
		var variables = {currentTiddler: title};
		for(var key in state.queryParameters) {
			variables[key] = state.queryParameters[key];
		}
		var text = state.wiki.renderTiddler(renderType,renderTemplate,{parseAsInline: true, variables: variables});

		var headers = {"Content-Type": renderType};
		state.sendResponse(200,headers,text,"utf8");
	} else {
		response.writeHead(404);
		response.end();
	}
};
