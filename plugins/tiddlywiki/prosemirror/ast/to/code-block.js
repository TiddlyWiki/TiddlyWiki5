/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/code-block.js
type: application/javascript
module-type: library
\*/

"use strict";

module.exports = function buildCodeBlock(context, node) {
	let codeElement = null;
	if(node.children && node.children.length > 0) {
		for(let i = 0; i < node.children.length; i++) {
			if(node.children[i].tag === "code") {
				codeElement = node.children[i];
				break;
			}
		}
	}
	if(codeElement && codeElement.children) {
		let textContent = "";
		for(let j = 0; j < codeElement.children.length; j++) {
			if(codeElement.children[j].type === "text") {
				textContent += codeElement.children[j].text;
			}
		}
		return {
			type: "code_block",
			content: [{ type: "text", text: textContent }]
		};
	}
	let fallbackText = "";
	if(node.children) {
		for(let k = 0; k < node.children.length; k++) {
			if(node.children[k].type === "text") {
				fallbackText += node.children[k].text;
			}
		}
	}
	return {
		type: "code_block",
		content: [{ type: "text", text: fallbackText }]
	};
};
