/*\
title: $:/plugins/tiddlywiki/markdown/md-to-tid/converters/rules/emphasis.js
type: application/javascript
module-type: mdast-to-wikiast-rule

Handler for markdown emphasis/italic tokens

\*/

"use strict";

exports.em_open = {
	type: "em_open",
	handler: function(token, context) {
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

		var emChildren = context.processInlineTokens(context.tokens.slice(context.index + 1, closeIdx - 1));

		context.skipTo = closeIdx - 1;

		return {
			type: "element",
			tag: "em",
			orderedAttributes: [],
			children: emChildren,
			rule: "italic"
		};
	}
};

exports.em_close = {
	type: "em_close",
	isCloseToken: true
};
