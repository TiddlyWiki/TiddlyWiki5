/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/markdown/handlers/link.js
type: application/javascript
module-type: markdown-to-wikiast-handler

Handler for markdown link tokens

\*/

"use strict";

exports.type = "link_open";

exports.handler = function(token, context) {
	// Find the matching close tag
	var closeIdx = context.index + 1;
	var depth = 1;
	while(closeIdx < context.tokens.length && depth > 0) {
		if(context.tokens[closeIdx].type === "link_open") {
			depth++;
		}
		if(context.tokens[closeIdx].type === "link_close") {
			depth--;
		}
		closeIdx++;
	}
	
	// Get the href from attributes
	var href = "";
	if(token.attrs) {
		for(var j = 0; j < token.attrs.length; j++) {
			if(token.attrs[j][0] === "href") {
				href = token.attrs[j][1];
				break;
			}
		}
	}
	
	// Process the content between open and close
	var linkChildren = context.processInlineTokens(context.tokens.slice(context.index + 1, closeIdx - 1));
	
	// Update context index to skip processed tokens
	context.skipTo = closeIdx - 1;
	
	return {
		type: "link",
		attributes: {
			to: {
				type: "string",
				value: href
			}
		},
		children: linkChildren,
		rule: "prettylink"
	};
};
