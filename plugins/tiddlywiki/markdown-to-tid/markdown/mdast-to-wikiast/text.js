/*\
title: $:/plugins/tiddlywiki/markdown-to-tid/markdown/rules/text.js
type: application/javascript
module-type: mdast-to-wikiast-rule

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