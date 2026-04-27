/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/element.js
type: application/javascript
module-type: library
\*/

"use strict";

const paragraph = require("$:/plugins/tiddlywiki/prosemirror/ast/to/paragraph.js");
const heading = require("$:/plugins/tiddlywiki/prosemirror/ast/to/heading.js");
const list = require("$:/plugins/tiddlywiki/prosemirror/ast/to/list.js");
const marks = require("$:/plugins/tiddlywiki/prosemirror/ast/to/marks.js");
const codeBlock = require("$:/plugins/tiddlywiki/prosemirror/ast/to/code-block.js");
const blockquote = require("$:/plugins/tiddlywiki/prosemirror/ast/to/blockquote.js");
const div = require("$:/plugins/tiddlywiki/prosemirror/ast/to/div.js");
const hardBreaks = require("$:/plugins/tiddlywiki/prosemirror/ast/to/hard-breaks.js");
const link = require("$:/plugins/tiddlywiki/prosemirror/ast/to/link.js");
const table = require("$:/plugins/tiddlywiki/prosemirror/ast/to/table.js");
const definitionList = require("$:/plugins/tiddlywiki/prosemirror/ast/to/definition-list.js");
const buildOpaqueFromNode = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js").buildOpaqueFromNode;

const elementBuilders = {
	p: paragraph,
	h1: (context, node) => heading.level(context, node, 1),
	h2: (context, node) => heading.level(context, node, 2),
	h3: (context, node) => heading.level(context, node, 3),
	h4: (context, node) => heading.level(context, node, 4),
	h5: (context, node) => heading.level(context, node, 5),
	h6: (context, node) => heading.level(context, node, 6),
	ul: list.buildUnorderedList,
	ol: list.buildOrderedList,
	li: list.buildListItem,
	strong: marks.buildStrong,
	b: marks.buildStrong,
	em: marks.buildEm,
	i: marks.buildEm,
	code: marks.buildCode,
	u: marks.buildUnderline,
	strike: marks.buildStrike,
	s: marks.buildStrike,
	del: marks.buildStrike,
	sup: marks.buildSup,
	sub: marks.buildSub,
	pre: codeBlock,
	blockquote: blockquote,
	div: div,
	hr: hardBreaks.buildHorizRule,
	br: hardBreaks.buildBr,
	a: link.buildAnchor,
	cite: link.buildCite,
	table: table.buildTable,
	tbody: (context, node) => table.buildTable(context, { children: node.children }),
	thead: (context, node) => table.buildTable(context, { children: node.children }),
	tfoot: (context, node) => table.buildTable(context, { children: node.children }),
	tr: table.buildTableRow,
	td: (context, node) => table.buildTableCell(context, node, false),
	th: (context, node) => table.buildTableCell(context, node, true),
	dl: definitionList.buildDefinitionList,
	dt: definitionList.buildDefinitionTerm,
	dd: definitionList.buildDefinitionDescription
};

module.exports = function element(context, node) {
	const builder = elementBuilders[node.tag];
	if(builder) {
		return builder(context, node);
	}
	return buildOpaqueFromNode(node);
};
