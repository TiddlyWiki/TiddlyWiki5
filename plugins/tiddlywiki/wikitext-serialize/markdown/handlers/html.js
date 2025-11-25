/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/markdown/handlers/html.js
type: application/javascript
module-type: markdown-to-wikiast-handler

Handler for markdown HTML tokens

\*/

"use strict";

exports.type = "html_block";
exports.isBlock = true;

exports.handler = function(token, context) {
	return {
		type: "raw",
		html: token.content,
		rule: "html"
	};
};
