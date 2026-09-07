/*\
title: $:/plugins/tiddlywiki/prosemirror/features/drag-handle/drop-logic.js
type: application/javascript
module-type: library

Shared, DOM-free logic for moving a block to a drop position.
Used by the drag-handle plugin and by tests.

\*/

"use strict";

const { NodeSelection } = require("prosemirror-state");
const { TextSelection } = require("prosemirror-state");

/**
 * Determine whether a given document position sits inside a list node.
 * A position exactly at a list's closing token (i.e. right after the list)
 * is treated as outside the list.
 */
function isInsideList(doc, pos) {
	try {
		const $pos = doc.resolve(Math.min(pos, doc.content.size));
		for(let depth = $pos.depth; depth >= 1; depth--) {
			if($pos.node(depth).type.name === "list") {
				// pos must be before the list node's closing token
				if(pos < $pos.end(depth)) {
					return true;
				}
			}
		}
	} catch(ex) {
		// ignore
	}
	return false;
}

/**
 * Find the first ancestor of the resolved position that is a list node.
 * Returns { pos, node } or null.
 */
function findListAncestor(doc, pos) {
	try {
		const $pos = doc.resolve(Math.min(pos, doc.content.size));
		for(let depth = $pos.depth; depth >= 1; depth--) {
			const node = $pos.node(depth);
			if(node.type.name === "list") {
				return { pos: $pos.before(depth), node: node };
			}
		}
	} catch(ex) {
		// ignore
	}
	return null;
}

/**
 * Compute where a dropped block should be inserted.
 *
 * Two drop zones are distinguished when the pointer is over a list item:
 * - "inside-list": the pointer is over the content area of the list item.
 *   A non-list block dropped here is wrapped into a new list item so it
 *   becomes part of the list structure.
 * - "list"/"doc": the pointer is over the marker/gutter or between items.
 *   The block is inserted as a sibling and list items are unwrapped when
 *   dropped outside a list.
 */
function computeDropTarget(view, coords, sourceNode) {
	const helpers = require("$:/plugins/tiddlywiki/prosemirror/features/drag-handle/helpers.js");
	if(!helpers.isCoordsInEditorHandleZone(view, coords)) return null;

	// First ask ProseMirror where the pointer landed. If it landed inside a
	// list node's content (including inside a paragraph that lives within a
	// list item), treat this as a drop "inside" that list item.
	const posInfo = view.posAtCoords(coords);
	if(posInfo) {
		const probePos = posInfo.inside >= 0 ? posInfo.inside : posInfo.pos;
		const listAncestor = findListAncestor(view.state.doc, probePos);
		if(listAncestor) {
			const box = view.nodeDOM(listAncestor.pos).getBoundingClientRect();
			const contentBox = getListContentBox(view, listAncestor.pos) || box;
			// "Inner" zone: the pointer is over the content area of the list
			// item. The dropped block is wrapped into a new list item that
			// becomes a sibling of this list item (before or after it).
			if(coords.left >= contentBox.left - 2) {
				const before = coords.top < box.top + box.height / 2;
				const insertPos = before ? listAncestor.pos : listAncestor.pos + listAncestor.node.nodeSize;
				return {
					insertPos: insertPos,
					dropContext: "inside-list",
					unwrapList: false
				};
			}
		}
	}

	const info = helpers.findBlockAtCoords(view, coords);
	if(!info) return null;
	const box = info.dom.getBoundingClientRect();
	const before = coords.top < box.top + box.height / 2;
	const insertPos = before ? info.pos : info.pos + info.node.nodeSize;
	const dropContext = isInsideList(view.state.doc, insertPos) ? "list" : "doc";
	return {
		insertPos: insertPos,
		dropContext: dropContext,
		unwrapList: sourceNode.type.name === "list" && dropContext !== "list"
	};
}

/**
 * Get the bounding box of a list item's content container.
 */
function getListContentBox(view, listPos) {
	try {
		const dom = view.nodeDOM(listPos);
		if(!dom) return null;
		const content = dom.querySelector(".list-content");
		if(content) return content.getBoundingClientRect();
	} catch(ex) {
		// ignore
	}
	return null;
}

/**
 * Build a transaction that moves `source` to `target`.
 */
function buildMoveTransaction(view, source, target) {
	const sourceFrom = source.pos;
	const sourceTo = source.pos + source.node.nodeSize;
	if(target.insertPos >= sourceFrom && target.insertPos <= sourceTo) {
		return null;
	}

	let tr = view.state.tr.delete(sourceFrom, sourceTo);
	let insertPos = tr.mapping.map(target.insertPos, target.insertPos > sourceFrom ? -1 : 1);
	let nodesToInsert;
	if(target.unwrapList) {
		nodesToInsert = source.node.content;
	} else if(target.dropContext === "inside-list" && source.node.type.name !== "list") {
		// Wrap the dropped block into a list item so it becomes part of the list.
		const listType = view.state.schema.nodes.list;
		if(listType) {
			const listNode = listType.create({ kind: "bullet" }, source.node);
			nodesToInsert = [listNode];
		} else {
			nodesToInsert = [source.node];
		}
	} else {
		nodesToInsert = [source.node];
	}
	tr = tr.insert(insertPos, nodesToInsert);
	try {
		const insertedNode = nodesToInsert[0];
		if(NodeSelection.isSelectable(insertedNode)) {
			tr.setSelection(NodeSelection.create(tr.doc, insertPos));
		} else {
			tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(insertPos + 1, tr.doc.content.size)), 1));
		}
	} catch(ex) {
		// ignore invalid selection positions
	}
	return tr;
}

exports.isInsideList = isInsideList;
exports.findListAncestor = findListAncestor;
exports.computeDropTarget = computeDropTarget;
exports.buildMoveTransaction = buildMoveTransaction;
exports.getListContentBox = getListContentBox;
