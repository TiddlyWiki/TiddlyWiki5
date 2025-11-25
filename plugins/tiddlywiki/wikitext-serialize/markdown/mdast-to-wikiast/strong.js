/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/markdown/rules/strong.js
type: application/javascript
module-type: mdast-to-wikiast-rule

Handler for markdown strong/bold tokens

\*/

"use strict";

exports.type = "strong_open";

exports.handler = function(token, context) {
	// Find the matching close tag
	var closeIdx = context.index + 1;
	var depth = 1;
	while(closeIdx < context.tokens.length && depth > 0) {
		if(context.tokens[closeIdx].type === "strong_open") {
			depth++;
		}
		if(context.tokens[closeIdx].type === "strong_close") {
			depth--;
		}
		closeIdx++;
	}
	
	// Process the content between open and close
	var strongChildren = context.processInlineTokens(context.tokens.slice(context.index + 1, closeIdx - 1));
	
	// Update context index to skip processed tokens
	context.skipTo = closeIdx - 1;
	
	return {
		type: "element",
		tag: "strong",
		orderedAttributes: [],
		children: strongChildren,
		rule: "bold"
	};
};
