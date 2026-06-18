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
 */
function isInsideList(doc, pos) {
	try {
		const $pos = doc.resolve(Math.min(pos, doc.content.size - 1));
		for(let depth = $pos.depth; depth >= 1; depth--) {
			if($pos.node(depth).type.name === "list") {
				return true;
			}
		}
	} catch(ex) {
		// ignore
	}
	return false;
}

/**
 * Compute where a dropped block should be inserted.
 */
function computeDropTarget(view, coords, sourceNode) {
	const helpers = require("$:/plugins/tiddlywiki/prosemirror/features/drag-handle/helpers.js");
	if(!helpers.isCoordsInEditorHandleZone(view, coords)) return null;
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
 * Build a transaction that moves `source` to `target`.
 */
function buildMoveTransaction(view, source, target) {
	const sourceFrom = source.pos;
	const sourceTo = source.pos + source.node.nodeSize;
	if(target.insertPos >= sourceFrom && target.insertPos <= sourceTo) {
		return null;
	}

	let tr = view.state.tr.delete(sourceFrom, sourceTo);
	const insertPos = tr.mapping.map(target.insertPos, target.insertPos > sourceFrom ? -1 : 1);
	if(target.unwrapList) {
		tr = tr.insert(insertPos, source.node.content);
	} else {
		tr = tr.insert(insertPos, source.node);
	}
	try {
		if(!target.unwrapList && NodeSelection.isSelectable(source.node)) {
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
exports.computeDropTarget = computeDropTarget;
exports.buildMoveTransaction = buildMoveTransaction;
