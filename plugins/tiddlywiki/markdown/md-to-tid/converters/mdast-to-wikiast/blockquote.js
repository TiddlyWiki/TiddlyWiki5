/*\
title: $:/plugins/tiddlywiki/markdown/md-to-tid/converters/rules/blockquote.js
type: application/javascript
module-type: mdast-to-wikiast-rule

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
