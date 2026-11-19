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
const sourceTextToParagraphs = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js").sourceTextToParagraphs;
const factory = $tw.utils.wikitextParseTree;

// What the parser makes of wikitext, by the kind the factory reports
const kindBuilders = {
	paragraph: paragraph,
	blankLine: paragraph,
	heading: (context, node) => heading.level(context, node, factory.headingLevel(node)),
	list: list.buildList,
	listItem: list.buildListItem,
	emphasis: marks.buildEmphasis,
	quoteBlock: blockquote,
	quoteCite: link.buildCite,
	horizontalRule: hardBreaks.buildHorizRule,
	hardBreak: hardBreaks.buildBr,
	externalLink: link.buildAnchor,
	table: table.buildTable,
	tableSection: (context, node) => table.buildTable(context, { children: node.children }),
	tableRow: table.buildTableRow,
	tableCell: table.buildTableCell,
	definitionList: definitionList.buildDefinitionList,
	definitionTerm: definitionList.buildDefinitionTerm,
	definitionDescription: definitionList.buildDefinitionDescription
};

// HTML written by hand, e.g. <b> or <pre>, by tag
const tagBuilders = {
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
	div: div,
	a: link.buildAnchor,
	cite: link.buildCite
};

module.exports = function element(context, node) {
	const builder = kindBuilders[factory.kindOf(node)] || tagBuilders[node.tag];
	if(builder) {
		return builder(context, node);
	}
	const opaqueNode = buildOpaqueFromNode(node, context);
	if(!isPlausibleHtmlTagName(node.tag) || isAttributeLikeTextElement(node, opaqueNode.attrs.rawText)) {
		return sourceTextToParagraphs(opaqueNode.attrs.rawText);
	}
	return opaqueNode;
};

function isPlausibleHtmlTagName(tag) {
	return typeof tag === "string" && /^[a-z][a-z0-9-]*$/i.test(tag);
}

function isAttributeLikeTextElement(node, rawText) {
	return !!(node && node.attributes && Object.keys(node.attributes).length > 0 && node.children && node.children.length > 0 && typeof rawText === "string" && rawText.indexOf("</") === -1);
}
