/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/table.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertNodes;
const convertANode = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertANode;
const factory = $tw.utils.wikitextParseTree;

function tableNode(builders, node) {
	const rows = [];
	if(node.content) {
		for(let i = 0; i < node.content.length; i++) {
			const rowNode = node.content[i];
			if(rowNode.type === "table_row") {
				rows.push(tableRow(builders, rowNode));
			}
		}
	}
	return factory.table(rows);
}

function tableRow(builders, node) {
	const cells = [];
	if(node.content) {
		for(let i = 0; i < node.content.length; i++) {
			const cellNode = node.content[i];
			if(cellNode.type === "table_header" || cellNode.type === "table_cell") {
				cells.push(tableCellOrHeader(builders, cellNode));
			}
		}
	}
	return factory.tableRow(cells);
}

function tableCellOrHeader(builders, node) {
	let inlineContent = [];
	if(node.content) {
		for(let i = 0; i < node.content.length; i++) {
			let child = node.content[i];
			if(child.type === "paragraph" && child.content) {
				const inlines = convertNodes(builders, child.content);
				if(Array.isArray(inlines)) {
					inlineContent = inlineContent.concat(inlines);
				} else {
					inlineContent.push(inlines);
				}
			} else {
				const converted = convertANode(builders, child);
				if(Array.isArray(converted)) {
					inlineContent = inlineContent.concat(converted);
				} else if(converted) {
					inlineContent.push(converted);
				}
			}
		}
	}
	return factory.tableCell(keepBreakElements(inlineContent), { header: node.type === "table_header" });
}

// A table row is one line, so a break inside a cell becomes the html element
function keepBreakElements(nodes) {
	return nodes.map((node) => {
		if(factory.kindOf(node) === "hardBreak" && node.rule === "ssnl") {
			return factory.htmlBreak();
		}
		if(node.children) {
			node.children = keepBreakElements(node.children);
		}
		return node;
	});
}

exports.tableNode = tableNode;
exports.tableRow = tableRow;
exports.tableCellOrHeader = tableCellOrHeader;
