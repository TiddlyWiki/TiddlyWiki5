/*\
title: $:/plugins/tiddlywiki/markdown/md-to-tid/converters/mdast-to-wikiast/link.js
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
		var href = "";
		var title = "";
	
		// Get href from attributes
		if(token.attrs) {
			for(var j = 0; j < token.attrs.length; j++) {
				if(token.attrs[j][0] === "href") {
					href = token.attrs[j][1];
				} else if(token.attrs[j][0] === "title") {
					title = token.attrs[j][1];
				}
			}
		}
	
		// Find the matching close tag
		while(closeIdx < context.tokens.length && depth > 0) {
			if(context.tokens[closeIdx].type === "link_open") {
				depth++;
			}
			if(context.tokens[closeIdx].type === "link_close") {
				depth--;
			}
			closeIdx++;
		}
	
		// Process the content between open and close
		var linkChildren = context.processInlineTokens(context.tokens.slice(context.index + 1, closeIdx - 1));
	
		// Update context index to skip processed tokens
		context.skipTo = closeIdx - 1;

		// Check if this is an autolink (text matches href, or text matches href without mailto:)
		if(!title && linkChildren.length === 1 && linkChildren[0].type === "text") {
			var text = linkChildren[0].text;
			if(text === href || (href.indexOf("mailto:") === 0 && href.slice(7) === text)) {
				return {
					type: "text",
					text: href
				};
			}
		}
	
		// Create the link element
		var attributes = {
			href: {
				type: "string",
				value: href
			}
		};
	
		// Add title if present
		if(title) {
			attributes.title = {
				type: "string",
				value: title
			};
		}
	
		return {
			type: "element",
			tag: "a",
			attributes: attributes,
			children: linkChildren,
			rule: "prettylink"
		};
	}
};

exports.link_close = {
	type: "link_close",
	isCloseToken: true
};