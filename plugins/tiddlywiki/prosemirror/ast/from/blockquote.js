/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/blockquote.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertNodes;

module.exports = function blockquote(builders, node) {
	const children = convertNodes(builders, node.content);
	if(node.attrs && node.attrs.cite) {
		children.push({
			type: "element",
			tag: "cite",
			children: [{ type: "text", text: node.attrs.cite }]
		});
	}
	return {
		type: "element",
		tag: "blockquote",
		rule: "quoteblock",
		attributes: {
			class: { type: "string", value: "tc-quote" }
		},
		children: children
	};
};
