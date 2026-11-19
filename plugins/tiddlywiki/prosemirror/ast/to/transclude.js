/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/transclude.js
type: application/javascript
module-type: library
\*/

"use strict";

const buildOpaqueFromNode = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js").buildOpaqueFromNode;
const factory = $tw.utils.wikitextParseTree;

module.exports = function transclude(context, node) {
	// Only a block level macro call becomes a text paragraph; an inline one stays opaque
	if(factory.kindOf(node) !== "macroCall" || !factory.isBlock(node)) {
		return buildOpaqueFromNode(node, context);
	}
	let widgetText = "<<" + node.attributes.$variable.value;
	if(node.orderedAttributes) {
		for(let i = 0; i < node.orderedAttributes.length; i++) {
			const attr = node.orderedAttributes[i];
			if(attr.name !== "$variable") {
				widgetText += " ";
				const safeValue = attr.value || "";
				const needsTriple = safeValue.indexOf('"') >= 0 || safeValue.indexOf(">>") >= 0;
				const q = needsTriple ? '"""' : '"';
				if(attr.name.match(/^(param)?\d+$/)) {
					widgetText += q + safeValue + q;
				} else {
					widgetText += attr.name + ":" + q + safeValue + q;
				}
			}
		}
	}
	widgetText += ">>";
	return {
		type: "paragraph",
		content: [{ type: "text", text: widgetText }]
	};
};
