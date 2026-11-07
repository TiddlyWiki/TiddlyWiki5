/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/text.js
type: application/javascript
module-type: library
\*/

"use strict";

module.exports = function text(context, node) {
	if(node.tag || typeof node.text !== "string") {
		return require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js").buildOpaqueFromNode(node, context);
	}
	if(!node.text) {
		return [];
	}
	return {
		type: "text",
		text: node.text
	};
};
