/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/table.js
type: application/javascript
module-type: library
\*/

"use strict";

const shared = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js");
const factory = $tw.utils.wikitextParseTree;

function buildTable(context, node) {
	if(!node.children || node.children.length === 0) {
		return shared.buildOpaqueFromNode(node, context);
	}
	const rows = [];
	const addRow = (rowNode) => {
		const row = buildTableRow(context, rowNode);
		if(row) rows.push(row);
	};
	node.children.forEach((child) => {
		const kind = factory.kindOf(child);
		if(kind === "tableRow") {
			addRow(child);
		} else if(kind === "tableSection") {
			(child.children || []).filter((grandchild) => factory.kindOf(grandchild) === "tableRow").forEach(addRow);
		}
	});
	if(rows.length === 0) {
		return shared.buildOpaqueFromNode(node, context);
	}
	return { type: "table", content: rows };
}

function buildTableRow(context, node) {
	if(!node.children || node.children.length === 0) return null;
	const cells = node.children.filter((child) => factory.kindOf(child) === "tableCell").map((child) => buildTableCell(context, child));
	if(cells.length === 0) return null;
	return { type: "table_row", content: cells };
}

function buildTableCell(context, child) {
	let cellContent = shared.convertNodes(context, child.children);
	if(!cellContent || cellContent.length === 0) {
		cellContent = [{ type: "paragraph" }];
	} else {
		const needsWrap = cellContent.every((node) => node.type === "text" || (node.marks && node.marks.length > 0));
		if(needsWrap) {
			cellContent = [{ type: "paragraph", content: cellContent }];
		}
	}
	const options = factory.tableCellOptions(child);
	const attrs = {};
	if(options.colspan) {
		attrs.colspan = options.colspan;
	}
	if(options.rowspan) {
		attrs.rowspan = options.rowspan;
	}
	return {
		type: options.header ? "table_header" : "table_cell",
		attrs: attrs,
		content: cellContent
	};
}

exports.buildTable = buildTable;
exports.buildTableRow = buildTableRow;
exports.buildTableCell = buildTableCell;
