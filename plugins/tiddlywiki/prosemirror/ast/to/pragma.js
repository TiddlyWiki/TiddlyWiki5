/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/pragma.js
type: application/javascript
module-type: library
\*/

"use strict";

const shared = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js");

function pragmaNode(context, node) {
	const pragmaCopy = {};
	for(const key in node) {
		if(node.hasOwnProperty(key) && key !== "children") {
			pragmaCopy[key] = node[key];
		}
	}
	pragmaCopy.children = [];
	const rawText = shared.serializeNodeToRawText(pragmaCopy);
	const firstLine = rawText.split("\n")[0] || rawText;
	const childResults = shared.convertNodes(context, node.children || []);
	const pragmaResult = {
		type: "pragma_block",
		attrs: {
			rawText: rawText,
			firstLine: firstLine.trim()
		}
	};
	return [pragmaResult].concat(childResults);
}

function voidNode(context, node) {
	if(node.parseType !== undefined) {
		const rawText = node.text || "";
		return {
			type: "typed_block",
			attrs: {
				rawText: rawText,
				parseType: node.parseType || "",
				renderType: node.renderType || null
			}
		};
	}
	return pragmaNode(context, node);
}

exports.pragmaNode = pragmaNode;
exports.voidNode = voidNode;
