/*\
title: $:/plugins/tiddlywiki/markdown/md-to-tid/converters/rules/heading.js
type: application/javascript
module-type: mdast-to-wikiast-rule

Handler for markdown heading tokens

\*/

"use strict";

exports.type = "heading_open";
exports.isBlock = true;

exports.handler = function(token, context) {
	var nextToken = context.tokens[context.index + 1];
	var children = [];
	if(nextToken && nextToken.type === "inline") {
		children = context.processInlineTokens(nextToken.children || []);
	}

	context.skipTo = context.index + 2;

	return {
		type: "element",
		tag: token.tag,
		attributes: {},
		orderedAttributes: [],
		children: children,
		rule: "heading"
	};
};
