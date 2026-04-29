/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/registry.js
type: application/javascript
module-type: library
\*/

"use strict";

const doc = require("$:/plugins/tiddlywiki/prosemirror/ast/from/doc.js");
const paragraph = require("$:/plugins/tiddlywiki/prosemirror/ast/from/paragraph.js");
const text = require("$:/plugins/tiddlywiki/prosemirror/ast/from/text.js");
const heading = require("$:/plugins/tiddlywiki/prosemirror/ast/from/heading.js");
const list = require("$:/plugins/tiddlywiki/prosemirror/ast/from/list.js");
const codeBlock = require("$:/plugins/tiddlywiki/prosemirror/ast/from/code-block.js");
const image = require("$:/plugins/tiddlywiki/prosemirror/ast/from/image.js");
const blockquote = require("$:/plugins/tiddlywiki/prosemirror/ast/from/blockquote.js");
const hardBreaks = require("$:/plugins/tiddlywiki/prosemirror/ast/from/hard-breaks.js");
const pragma = require("$:/plugins/tiddlywiki/prosemirror/ast/from/pragma.js");
const table = require("$:/plugins/tiddlywiki/prosemirror/ast/from/table.js");
const definitionList = require("$:/plugins/tiddlywiki/prosemirror/ast/from/definition-list.js");

module.exports = {
	doc: doc,
	paragraph: paragraph,
	text: text,
	heading: heading,
	list: list,
	code_block: codeBlock,
	image: image,
	blockquote: blockquote,
	horizontal_rule: hardBreaks.horizontalRule,
	hard_break: hardBreaks.hardBreak,
	hard_line_breaks_block: hardBreaks.hardLineBreaksBlock,
	typed_block: pragma.typedBlock,
	pragma_block: pragma.pragmaBlock,
	opaque_block: pragma.opaqueBlock,
	table: table.tableNode,
	table_row: table.tableRow,
	table_header: table.tableCellOrHeader,
	table_cell: table.tableCellOrHeader,
	definition_list: definitionList.definitionList,
	definition_term: definitionList.definitionTerm,
	definition_description: definitionList.definitionDescription
};
