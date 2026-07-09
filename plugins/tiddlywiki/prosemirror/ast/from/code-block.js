/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/code-block.js
type: application/javascript
module-type: library
\*/

"use strict";

module.exports = function codeBlock(builders, node) {
	let textContent = "";
	if(node.content && node.content.length > 0) {
		textContent = node.content.map((child) => child.text || "").join("");
	}
	const language = node.attrs && node.attrs.language || "";
	return {
		type: "codeblock",
		rule: "codeblock",
		attributes: {
			code: { type: "string", value: textContent },
			language: { type: "string", value: language }
		}
	};
};
