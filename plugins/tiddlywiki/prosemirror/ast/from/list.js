/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/list.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertANode = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertANode;
const factory = $tw.utils.wikitextParseTree;

function itemsOf(builders, listNode) {
	const items = [];
	if(listNode.content && listNode.content.forEach) {
		listNode.content.forEach((item) => {
			items.push(factory.listItem(convertANode(builders, item)));
		});
	}
	return items;
}

module.exports = function list(builders, node, context) {
	const kind = node.attrs && node.attrs.kind === "ordered" ? "ol" : "ul";
	let items = itemsOf(builders, node);
	// Consecutive editor lists of one kind are one wikitext list
	while(context && context.nodes && context.nodes.length > 0) {
		const nextNode = context.nodes[0];
		if(nextNode.type === "list" && ((node.attrs && node.attrs.kind) === (nextNode.attrs && nextNode.attrs.kind))) {
			items = items.concat(itemsOf(builders, context.nodes.shift()));
		} else {
			break;
		}
	}
	return factory.list(kind, items);
};
