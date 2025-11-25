/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/markdown/rules/link.js
type: application/javascript
module-type: mdast-to-wikiast-rule

Handler for markdown link tokens

\*/

"use strict";

exports.link_open = {
	type: "link_open",
	handler: function(token, context) {
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
	
	// Check if this is an autolink (text content matches href)
	var isAutolink = linkChildren.length === 1 && 
	                 linkChildren[0].type === "text" && 
	                 (linkChildren[0].text === href || linkChildren[0].text === href.replace(/^mailto:/, ""));
	
	// Update context index to skip processed tokens
	context.skipTo = closeIdx - 1;
	
	if(isAutolink) {
		// For autolinks, just return the URL as plain text
		return {
			type: "text",
			text: href
		};
	}
	
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
	}
};

exports.link_close = {
	type: "link_close",
	isCloseToken: true
};
