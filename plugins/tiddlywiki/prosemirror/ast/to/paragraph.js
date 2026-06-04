/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/paragraph.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js").convertNodes;

function isLiftedBlockNode(node) {
	return !!node && (
		node.type === "opaque_block" ||
		node.type === "pragma_block" ||
		node.type === "typed_block"
	);
}

function pushParagraphOrLiftedBlocks(result, context, children) {
	const converted = convertNodes(context, children);
	if(converted.length > 0 && converted.every(isLiftedBlockNode)) {
		result.push.apply(result, converted);
		return;
	}
	const paragraph = { type: "paragraph" };
	if(converted.length > 0) {
		paragraph.content = converted;
	}
	result.push(paragraph);
}

module.exports = function buildParagraph(context, node) {
	const children = node.children || [];
	const result = [];
	let currentP = [];
	for(let i = 0; i < children.length; i++) {
		if(children[i].rule === "hardlinebreaks") {
			if(currentP.length > 0) {
				pushParagraphOrLiftedBlocks(result, context, currentP);
				currentP = [];
			}
			const hardBlock = [];
			while(i < children.length && children[i].rule === "hardlinebreaks") {
				hardBlock.push(children[i]);
				i++;
			}
			i--;
			const contentBlock = hardBlock.filter((child) => !child.isRuleEnd);
			result.push({
				type: "hard_line_breaks_block",
				content: convertNodes(context, contentBlock)
			});
		} else {
			currentP.push(children[i]);
		}
	}
	if(currentP.length > 0) {
		pushParagraphOrLiftedBlocks(result, context, currentP);
	}
	if(result.length === 1) {
		return result[0];
	}
	if(result.length > 1) {
		return result;
	}
	return {
		type: "paragraph"
	};
};
