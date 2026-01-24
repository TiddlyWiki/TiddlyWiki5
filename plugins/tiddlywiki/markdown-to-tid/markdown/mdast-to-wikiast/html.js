/*\
title: $:/plugins/tiddlywiki/markdown-to-tid/markdown/rules/html.js
type: application/javascript
module-type: mdast-to-wikiast-rule

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
