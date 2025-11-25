/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/markdown/rules/text.js
type: application/javascript
module-type: markdown-to-wikiast-handler

Handler for markdown text tokens

\*/

"use strict";

exports.type = "text";

exports.handler = function(token, context) {
	return {
		type: "text",
		text: token.content
	};
};
