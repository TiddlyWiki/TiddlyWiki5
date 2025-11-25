/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/markdown/handlers/blockquote.js
type: application/javascript
module-type: markdown-to-wikiast-handler

Handler for markdown blockquote tokens

\*/

"use strict";

exports.blockquote_open = {
	type: "blockquote_open",
	isBlock: true,
	isContainer: true,
	handler: function(token, context) {
		return {
			type: "element",
			tag: "blockquote",
			orderedAttributes: [],
			children: [],
			attributes: {
				class: {
					type: "string",
					value: " "  // Single space for basic blockquote (matches WikiText <<< syntax)
				}
			},
			rule: "quoteblock"
		};
	}
};

exports.blockquote_close = {
	type: "blockquote_close",
	isContainerClose: true,
	handler: function(token, context) {
		// Container close handler, actual pop happens in main loop
		return null;
	}
};
