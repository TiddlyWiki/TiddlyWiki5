/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/code-block.js
type: application/javascript
module-type: library
\*/

"use strict";

const factory = $tw.utils.wikitextParseTree;

module.exports = function codeBlock(builders, node) {
	let textContent = "";
	if(node.content && node.content.length > 0) {
		textContent = node.content.map((child) => child.text || "").join("");
	}
	return factory.codeBlock(textContent, node.attrs && node.attrs.language || "");
};
