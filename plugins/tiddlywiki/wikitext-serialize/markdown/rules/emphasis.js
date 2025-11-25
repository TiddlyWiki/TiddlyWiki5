/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/markdown/rules/emphasis.js
type: application/javascript
module-type: markdown-to-wikiast-handler

Handler for markdown emphasis/italic tokens

\*/

"use strict";

exports.type = "em_open";

exports.handler = function(token, context) {
	// Find the matching close tag
	var closeIdx = context.index + 1;
	var depth = 1;
	while(closeIdx < context.tokens.length && depth > 0) {
		if(context.tokens[closeIdx].type === "em_open") {
			depth++;
		}
		if(context.tokens[closeIdx].type === "em_close") {
			depth--;
		}
		closeIdx++;
	}
	
	// Process the content between open and close
	var emChildren = context.processInlineTokens(context.tokens.slice(context.index + 1, closeIdx - 1));
	
	// Update context index to skip processed tokens
	context.skipTo = closeIdx - 1;
	
	return {
		type: "element",
		tag: "em",
		orderedAttributes: [],
		children: emChildren,
		rule: "italic"
	};
};
