/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/hard-breaks.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertNodes;

function horizontalRule() {
	return {
		type: "element",
		tag: "hr",
		rule: "horizrule"
	};
}

function hardBreak() {
	return {
		type: "element",
		tag: "br"
	};
}

function hardLineBreaksBlock(builders, node) {
	const children = convertNodes(builders, node.content || []);
	if(children.length === 0) {
		return {
			type: "element",
			tag: "p",
			rule: "parseblock",
			children: [
				{ type: "text", text: "", rule: "hardlinebreaks", isRuleStart: true },
				{ type: "element", tag: "br", rule: "hardlinebreaks", isRuleEnd: true }
			]
		};
	}
	for(let i = 0; i < children.length; i++) {
		children[i].rule = "hardlinebreaks";
	}
	children[0].isRuleStart = true;
	children.push({
		type: "element",
		tag: "br",
		rule: "hardlinebreaks",
		isRuleEnd: true
	});
	return {
		type: "element",
		tag: "p",
		rule: "parseblock",
		children: children
	};
}

exports.horizontalRule = horizontalRule;
exports.hardBreak = hardBreak;
exports.hardLineBreaksBlock = hardLineBreaksBlock;
