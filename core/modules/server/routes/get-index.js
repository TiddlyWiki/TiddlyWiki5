/*\
title: $:/core/modules/server/routes/get-index.js
type: application/javascript
module-type: route

GET /

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var zlib = require('zlib');

exports.method = "GET";

exports.path = /^\/$/;

exports.handler = function(request,response,state) {
	var acceptEncoding = request.headers['accept-encoding'];
	if (!acceptEncoding) { acceptEncoding = ''; }

	var text = state.wiki.renderTiddler(state.server.get("root-render-type"),state.server.get("root-tiddler"));

	var responseHeaders = {
		"Content-Type": state.server.get("root-serve-type")
	};

	if (/\bdeflate\b/.test(acceptEncoding)) {
		responseHeaders['Content-Encoding'] = 'deflate';
		text = zlib.deflateSync(text);
	} else if (/\bgzip\b/.test(acceptEncoding)) {
		responseHeaders['Content-Encoding'] = 'gzip';
		text = zlib.gzipSync(text);
	}

	response.writeHead(200, responseHeaders);
	response.end(text);
};

}());
