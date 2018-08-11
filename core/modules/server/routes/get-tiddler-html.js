/*\
title: $:/core/modules/server/routes/get-tiddler-html.js
type: application/javascript
module-type: route

GET /:title

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/([^\/]+)$/;

exports.handler = function(request,response,state) {
	var title = decodeURIComponent(state.params[0]),
		tiddler = state.wiki.getTiddler(title);
	if(tiddler) {
		var renderType,template;
		// Render ordinary tiddlers as HTML, and system tiddlers in plain text
		if(state.wiki.isSystemTiddler(title)) {
			renderType = state.server.get("system-tiddler-render-type");
			template = state.server.get("system-tiddler-template");
		} else {
			renderType = state.server.get("tiddler-render-type");
			template = state.server.get("tiddler-template");
		}
		var text = state.wiki.renderTiddler(renderType,template,{parseAsInline: true, variables: {currentTiddler: title}});
		// Naughty not to set a content-type, but it's the easiest way to ensure the browser will see HTML pages as HTML, and accept plain text tiddlers as CSS or JS
		response.writeHead(200);
		response.end(text,"utf8");
	} else {
		response.writeHead(404);
		response.end();
	}
};

}());
