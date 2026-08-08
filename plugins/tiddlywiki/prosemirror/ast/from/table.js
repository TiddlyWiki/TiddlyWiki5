/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/table.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertNodes;
const convertANode = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertANode;

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
	return {
		type: "element",
		tag: "table",
		rule: "table",
		children: [{
			type: "element",
			tag: "tbody",
			children: rows
		}]
	};
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
	return {
		type: "element",
		tag: "tr",
		children: cells
	};
}

function tableCellOrHeader(builders, node) {
	const isHeader = node.type === "table_header";
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
	return {
		type: "element",
		tag: isHeader ? "th" : "td",
		children: inlineContent
	};
}

exports.tableNode = tableNode;
exports.tableRow = tableRow;
exports.tableCellOrHeader = tableCellOrHeader;
