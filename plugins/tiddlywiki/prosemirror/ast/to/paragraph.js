/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/paragraph.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js").convertNodes;

module.exports = function buildParagraph(context, node) {
	const children = node.children || [];
	const result = [];
	let currentP = [];
	for(let i = 0; i < children.length; i++) {
		if(children[i].rule === "hardlinebreaks") {
			if(currentP.length > 0) {
				result.push({
					type: "paragraph",
					content: convertNodes(context, currentP)
				});
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
		result.push({
			type: "paragraph",
			content: convertNodes(context, currentP)
		});
	}
	if(result.length === 1) {
		return result[0];
	}
	if(result.length > 1) {
		return result;
	}
	return {
		type: "paragraph",
		content: []
	};
};
