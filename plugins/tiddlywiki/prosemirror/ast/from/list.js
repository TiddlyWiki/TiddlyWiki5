/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/list.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertANode = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertANode;

module.exports = function list(builders, node, context) {
	const listType = node.attrs && node.attrs.kind === "ordered" ? "ol" : "ul";
	let listItems = [];
	if(node.content && node.content.forEach) {
		node.content.forEach((item) => {
			listItems.push({
				type: "element",
				tag: "li",
				children: convertANode(builders, item)
			});
		});
	}
	while(context && context.nodes && context.nodes.length > 0) {
		const nextNode = context.nodes[0];
		if(nextNode.type === "list" && ((node.attrs && node.attrs.kind) === (nextNode.attrs && nextNode.attrs.kind))) {
			const consumedNode = context.nodes.shift();
			if(consumedNode.content && consumedNode.content.forEach) {
				consumedNode.content.forEach((item) => {
					listItems.push({
						type: "element",
						tag: "li",
						children: convertANode(builders, item)
					});
				});
			}
		} else {
			break;
		}
	}
	return {
		type: "element",
		tag: listType,
		rule: "list",
		children: listItems
	};
};
