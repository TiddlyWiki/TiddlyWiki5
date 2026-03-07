/*\
title: $:/plugins/tiddlywiki/markdown/md-to-tid/converters/rules/text.js
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