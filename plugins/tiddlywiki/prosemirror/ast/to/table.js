/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/table.js
type: application/javascript
module-type: library
\*/

"use strict";

const shared = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js");

function buildTable(context, node) {
	if(!node.children || node.children.length === 0) {
		return shared.buildOpaqueFromNode(node);
	}
	const rows = [];
	for(let i = 0; i < node.children.length; i++) {
		const child = node.children[i];
		if(child.type === "element" && child.tag === "tr") {
			const row = buildTableRow(context, child);
			if(row) rows.push(row);
		} else if(child.type === "element" && (child.tag === "tbody" || child.tag === "thead" || child.tag === "tfoot")) {
			if(child.children) {
				for(let j = 0; j < child.children.length; j++) {
					const grandchild = child.children[j];
					if(grandchild.type === "element" && grandchild.tag === "tr") {
						const row2 = buildTableRow(context, grandchild);
						if(row2) rows.push(row2);
					}
				}
			}
		}
	}
	if(rows.length === 0) {
		return shared.buildOpaqueFromNode(node);
	}
	return { type: "table", content: rows };
}

function buildTableRow(context, node) {
	if(!node.children || node.children.length === 0) return null;
	const cells = [];
	for(let i = 0; i < node.children.length; i++) {
		const child = node.children[i];
		if(child.type === "element" && (child.tag === "td" || child.tag === "th")) {
			cells.push(buildTableCell(context, child, child.tag === "th"));
		}
	}
	if(cells.length === 0) return null;
	return { type: "table_row", content: cells };
}

function buildTableCell(context, child, isHeader) {
	let cellContent = shared.convertNodes(context, child.children);
	if(!cellContent || cellContent.length === 0) {
		cellContent = [{ type: "paragraph" }];
	} else {
		const needsWrap = cellContent.every((node) => node.type === "text" || (node.marks && node.marks.length > 0));
		if(needsWrap) {
			cellContent = [{ type: "paragraph", content: cellContent }];
		}
	}
	const attrs = {};
	if(child.attributes) {
		if(child.attributes.colspan) {
			attrs.colspan = parseInt(child.attributes.colspan.value, 10) || 1;
		}
		if(child.attributes.rowspan) {
			attrs.rowspan = parseInt(child.attributes.rowspan.value, 10) || 1;
		}
	}
	return {
		type: isHeader ? "table_header" : "table_cell",
		attrs: attrs,
		content: cellContent
	};
}

exports.buildTable = buildTable;
exports.buildTableRow = buildTableRow;
exports.buildTableCell = buildTableCell;
