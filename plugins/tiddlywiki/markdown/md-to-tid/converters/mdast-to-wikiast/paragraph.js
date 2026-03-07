/*\
title: $:/plugins/tiddlywiki/markdown/md-to-tid/converters/rules/paragraph.js
type: application/javascript
module-type: mdast-to-wikiast-rule

Handler for markdown paragraph tokens
\*/

"use strict";

exports.type = "paragraph_open";
exports.isBlock = true;

exports.handler = function(token, context) {
	var nextToken = context.tokens[context.index + 1];
	var children = [];
	if(nextToken && nextToken.type === "inline") {
		children = context.processInlineTokens(nextToken.children || []);
	}
	
	// Skip the inline and closing tokens
	context.skipTo = context.index + 2;
	
	// In WikiText, paragraphs are just text nodes separated by blank lines
	// We create a special paragraph container that serialization will handle
	return {
		type: "element",
		tag: "p",
		orderedAttributes: [],
		children: children,
		isBlock: true,
		rule: "parseblock"  // Use parseblock rule which just serializes children + blank line
	};
};