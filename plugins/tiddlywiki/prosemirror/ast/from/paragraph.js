/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/paragraph.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertNodes;

let parseWidget;
try {
	parseWidget = require("$:/plugins/tiddlywiki/prosemirror/blocks/widget/utils.js").parseWidget;
} catch(e) {
	parseWidget = null;
}

module.exports = function paragraph(builders, node) {
	if(node.content && node.content.length === 1 && node.content[0].type === "text") {
		const text = node.content[0].text.trim();
		const parsed = parseWidget ? parseWidget(text) : null;
		if(parsed) {
			const widgetName = parsed.widgetName;
			const parsedAttrs = parsed.attributes || {};
			const parsedOrderedAttrs = parsed.orderedAttributes || [];
			const attributes = { $variable: { name: "$variable", type: "string", value: widgetName } };
			const orderedAttributes = [{ name: "$variable", type: "string", value: widgetName }];
			const sourceAttributes = parsedOrderedAttrs.length > 0 ? parsedOrderedAttrs : Object.keys(parsedAttrs).map((key) => ({
				name: key,
				value: parsedAttrs[key]
			}));
			for(let index = 0; index < sourceAttributes.length; index++) {
				const sourceAttr = sourceAttributes[index];
				const attribute = { name: sourceAttr.name, type: "string", value: sourceAttr.value };
				if(sourceAttr.quoted) {
					attribute.quoted = true;
				}
				if(sourceAttr.assignmentOperator) {
					attribute.assignmentOperator = sourceAttr.assignmentOperator;
				}
				attributes[sourceAttr.name] = attribute;
				orderedAttributes.push(attribute);
			}
			return {
				type: "transclude",
				attributes: attributes,
				orderedAttributes: orderedAttributes,
				isBlock: true,
				rule: "macrocallblock"
			};
		}
	}
	return {
		type: "element",
		tag: "p",
		rule: "parseblock",
		children: convertNodes(builders, node.content)
	};
};
