/*\
title: $:/plugins/tiddlywiki/markdown/md-to-tid/converters/rules/strikethrough.js
type: application/javascript
module-type: mdast-to-wikiast-rule

Handler for markdown strikethrough tokens
\*/

"use strict";

exports.s_open = {
	type: "s_open",
	handler: function(token, context) {
	// Find the matching close tag
		var closeIdx = context.index + 1;
		var depth = 1;
		while(closeIdx < context.tokens.length && depth > 0) {
			if(context.tokens[closeIdx].type === "s_open") {
				depth++;
			}
			if(context.tokens[closeIdx].type === "s_close") {
				depth--;
			}
			closeIdx++;
		}
	
		// Process the content between open and close
		var sChildren = context.processInlineTokens(context.tokens.slice(context.index + 1, closeIdx - 1));
	
		// Update context index to skip processed tokens
		context.skipTo = closeIdx - 1;
	
		return {
			type: "element",
			tag: "strike",
			orderedAttributes: [],
			children: sChildren,
			rule: "strikethrough"
		};
	}
};

exports.s_close = {
	type: "s_close",
	isCloseToken: true
};