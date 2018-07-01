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
		var outputType,serveType,template;
		// Render ordinary tiddlers as HTML, and system tiddlers in plain text
		if(state.wiki.isSystemTiddler(title)) {
			outputType = "text/plain";
			serveType = "text/plain";
			template = "$:/core/templates/wikified-tiddler";
		} else {
			outputType = "text/html";
			serveType = "text/html";
			template = "$:/core/templates/server/static.tiddler.html";
		}
		var text = state.wiki.renderTiddler(outputType,template,{variables: {currentTiddler: title}});
		// Naughty not to set a content-type, but it's the easiest way to ensure the browser will see HTML pages as HTML, and accept plain text tiddlers as CSS or JS
		response.writeHead(200);
		response.end(text,"utf8");
	} else {
		response.writeHead(404);
		response.end();
	}
};

}());
