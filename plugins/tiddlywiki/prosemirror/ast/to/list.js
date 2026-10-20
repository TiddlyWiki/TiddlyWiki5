/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/list.js
type: application/javascript
module-type: library
\*/

"use strict";

const shared = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js");
const factory = $tw.utils.wikitextParseTree;

// The editor holds one list node per item
function buildList(context, node) {
	const ctx = shared.childContext(context);
	const kind = factory.listKind(node) === "ol" ? "ordered" : "bullet";
	return factory.listItems(node).map((item) => ({
		type: "list",
		attrs: {
			kind: kind,
			order: null,
			checked: false,
			collapsed: false
		},
		content: buildListItem(ctx, item.node)
	}));
}

function buildListItem(context, node) {
	const ctx = shared.childContext(context);
	const processedContent = shared.convertNodes(ctx, node.children);
	return shared.wrapTextNodesInParagraphs(processedContent);
}

exports.buildList = buildList;
exports.buildListItem = buildListItem;
