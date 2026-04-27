/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/codeblock.js
type: application/javascript
module-type: library
\*/

"use strict";

module.exports = function codeblock(context, node) {
	void context;
	const code = node.attributes && node.attributes.code ? node.attributes.code.value : "";
	const language = node.attributes && node.attributes.language ? node.attributes.language.value : "";
	return {
		type: "code_block",
		attrs: language ? { language: language } : {},
		content: [{ type: "text", text: code }]
	};
};
