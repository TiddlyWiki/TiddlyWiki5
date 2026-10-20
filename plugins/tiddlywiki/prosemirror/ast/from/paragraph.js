/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/paragraph.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertNodes;
const factory = $tw.utils.wikitextParseTree;

let parseWidget;
try {
	parseWidget = require("$:/plugins/tiddlywiki/prosemirror/blocks/widget/utils.js").parseWidget;
} catch(e) {
	parseWidget = null;
}

module.exports = function paragraph(builders, node) {
	if(!node.content || node.content.length === 0) {
		return factory.blankLine();
	}
	// A paragraph holding nothing but a macro call is the call itself at block level
	if(node.content.length === 1 && node.content[0].type === "text") {
		const parsed = parseWidget ? parseWidget(node.content[0].text.trim()) : null;
		if(parsed) {
			const parsedAttrs = parsed.attributes || {};
			const params = (parsed.orderedAttributes && parsed.orderedAttributes.length > 0) ? parsed.orderedAttributes : Object.keys(parsedAttrs).map((key) => ({
				name: key,
				value: parsedAttrs[key]
			}));
			return factory.macroCall(parsed.widgetName, params.map((param) => ({
				name: param.name,
				value: param.value,
				quoted: param.quoted,
				assignmentOperator: param.assignmentOperator
			})), { block: true });
		}
	}
	return factory.paragraph(convertNodes(builders, node.content));
};
