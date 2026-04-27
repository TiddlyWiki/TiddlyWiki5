/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/transclude.js
type: application/javascript
module-type: library
\*/

"use strict";

const buildOpaqueFromNode = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js").buildOpaqueFromNode;

module.exports = function transclude(context, node) {
	void context;
	const hasVariable = node.attributes && node.attributes.$variable;
	const isMacroCall = hasVariable && (node.rule === "macrocallblock" || node.rule === "macrocall" || node.rule === "macrodef");
	if(!isMacroCall) {
		return buildOpaqueFromNode(node);
	}
	let widgetText = "<<";
	const widgetName = hasVariable ? node.attributes.$variable.value : "unknown";
	widgetText += widgetName;
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
