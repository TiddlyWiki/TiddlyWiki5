/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/markdown/handlers/heading.js
type: application/javascript
module-type: markdown-to-wikiast-handler

Handler for markdown heading tokens

\*/

"use strict";

exports.type = "heading_open";
exports.isBlock = true;

exports.handler = function(token, context) {
	var level = parseInt(token.tag.substr(1), 10);
	var nextToken = context.tokens[context.index + 1];
	var children = [];
	if(nextToken && nextToken.type === "inline") {
		children = context.processInlineTokens(nextToken.children || []);
	}
	
	// Skip the inline and closing tokens
	context.skipTo = context.index + 2;
	
	return {
		type: "element",
		tag: token.tag,
		attributes: {},
		children: children,
		rule: "heading"
	};
};
