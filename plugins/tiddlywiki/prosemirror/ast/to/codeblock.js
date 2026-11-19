/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/codeblock.js
type: application/javascript
module-type: library
\*/

"use strict";

module.exports = function codeblock(context, node) {
	const parts = $tw.utils.wikitextParseTree.codeBlockParts(node);
	if(!parts || node.isBlock === false) {
		return require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js").buildOpaqueFromNode(node,context);
	}
	const {code, language} = parts;
	const codeBlock = {
		type: "code_block",
		attrs: language ? { language: language } : {}
	};
	if(code) {
		codeBlock.content = [{ type: "text", text: code }];
	}
	return codeBlock;
};
