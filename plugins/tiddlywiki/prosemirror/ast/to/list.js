/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/list.js
type: application/javascript
module-type: library
\*/

"use strict";

const shared = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js");

function buildUnorderedList(context, node) {
	const ctx = shared.childContext(context);
	return node.children.map((item) => ({
		type: "list",
		attrs: {
			kind: "bullet",
			order: null,
			checked: false,
			collapsed: false
		},
		content: shared.convertANode(ctx, item)
	}));
}

function buildOrderedList(context, node) {
	const ctx = shared.childContext(context);
	return node.children.map((item) => ({
		type: "list",
		attrs: {
			kind: "ordered",
			order: null,
			checked: false,
			collapsed: false
		},
		content: shared.convertANode(ctx, item)
	}));
}

function buildListItem(context, node) {
	const ctx = shared.childContext(context);
	const processedContent = shared.convertNodes(ctx, node.children);
	return shared.wrapTextNodesInParagraphs(processedContent);
}

exports.buildUnorderedList = buildUnorderedList;
exports.buildOrderedList = buildOrderedList;
exports.buildListItem = buildListItem;
