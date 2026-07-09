/*\
title: $:/plugins/tiddlywiki/prosemirror/features/drag-handle/helpers.js
type: application/javascript
module-type: library

Shared helpers for the ProseMirror drag handle feature.

\*/

"use strict";

const HANDLE_POINTER_BRIDGE = 28;
const HANDLE_HIT_GUTTER = 96;
const HANDLE_HIT_TRAILING = 24;
const BLOCK_VERTICAL_TOLERANCE = 4;

function lang(suffix, fallback) {
	return $tw.wiki.getTiddlerText(
		"$:/plugins/tiddlywiki/prosemirror/language/DragHandle/" + suffix, fallback);
}

function getSvgIcon(tiddlerTitle, size) {
	size = size || "1em";
	try {
		const htmlStr = $tw.wiki.renderTiddler("text/html", tiddlerTitle, {
			variables: { size: size }
		});
		if(!htmlStr) return null;
		const container = document.createElement("div");
		container.innerHTML = htmlStr;
		const svgEl = container.querySelector("svg");
		if(svgEl) return svgEl;
	} catch(e) { /* ignore */ }
	return null;
}

function isRTL() {
	const dir = document.documentElement.getAttribute("dir");
	return dir === "rtl";
}

function isElementNode(dom) {
	return dom && dom.nodeType === 1;
}

function isCoordsInEditorHandleZone(view, coords) {
	if(!view || !view.dom || !coords) return false;
	const box = view.dom.getBoundingClientRect();
	const rtl = isRTL();
	// The handle zone covers the editor content plus a generous leading gutter.
	// This allows the handle to appear when the pointer is in the blank area
	// before a line, even when posAtCoords() cannot resolve the position.
	const leading = rtl ? box.right + HANDLE_HIT_GUTTER : box.left - HANDLE_HIT_GUTTER;
	const trailing = rtl ? box.left - HANDLE_HIT_TRAILING : box.right + HANDLE_HIT_TRAILING;
	const minX = Math.min(leading, trailing);
	const maxX = Math.max(leading, trailing);
	return coords.top >= box.top - BLOCK_VERTICAL_TOLERANCE &&
		coords.top <= box.bottom + BLOCK_VERTICAL_TOLERANCE &&
		coords.left >= minX &&
		coords.left <= maxX;
}

function getNodeDepth(doc, pos) {
	try {
		return doc.resolve(Math.min(pos + 1, doc.content.size)).depth;
	} catch(ex) {
		return 0;
	}
}

function isGeometryHandleTarget(view, node, parent) {
	return node && node.isBlock && (
		node.type.name === "list" ||
		node.type.spec.atom ||
		node.type.spec.draggable ||
		parent === view.state.doc
	);
}

function getBlockInfo(view, pos, node, depth) {
	const dom = view.nodeDOM(pos);
	if(!isElementNode(dom)) return null;
	return { pos: pos, node: node, dom: dom, depth: depth };
}

function getListHitBox(dom) {
	// For flat-list items the ::marker lives outside the border box, so the
	// regular getBoundingClientRect() misses the area users expect to hover.
	// We expand the hit box to cover the marker gutter on the leading side.
	const box = dom.getBoundingClientRect();
	const listIndent = parseFloat(getComputedStyle(dom).getPropertyValue("--pm-list-indent")) || 40;
	const markerWidth = 28; // approximate ::marker/number width
	return {
		top: box.top,
		bottom: box.bottom,
		left: box.left - listIndent - markerWidth,
		right: box.right
	};
}

function findBlockByGeometry(view, coords) {
	if(!isCoordsInEditorHandleZone(view, coords)) return null;
	let best = null;
	view.state.doc.descendants((node, pos, parent) => {
		if(!isGeometryHandleTarget(view, node, parent)) return true;
		const dom = view.nodeDOM(pos);
		if(!isElementNode(dom)) return true;
		const isList = node.type.name === "list";
		const box = isList ? getListHitBox(dom) : dom.getBoundingClientRect();
		if(box.width === 0 && box.height === 0) return true;
		if(coords.top < box.top - BLOCK_VERTICAL_TOLERANCE || coords.top > box.bottom + BLOCK_VERTICAL_TOLERANCE) {
			return true;
		}
		const depth = getNodeDepth(view.state.doc, pos);
		const centerDistance = Math.abs(coords.top - (box.top + box.bottom) / 2);
		// Prefer the deepest block at a given vertical position so that nested
		// list items get their own handle instead of being swallowed by the parent.
		const score = centerDistance - depth * 10;
		if(!best || score < best.score) {
			best = { score: score, info: { pos: pos, node: node, dom: dom, depth: depth, isList: isList } };
		}
		return true;
	});
	return best && best.info;
}

function findBlockFromResolvedPosition(view, posInfo) {
	if(!posInfo) return null;
	try {
		if(posInfo.inside >= 0) {
			const innerNode = view.state.doc.nodeAt(posInfo.inside);
			if(innerNode && innerNode.isBlock && (innerNode.type.name === "list" || innerNode.type.spec.atom || innerNode.type.spec.draggable)) {
				const innerInfo = getBlockInfo(view, posInfo.inside, innerNode, getNodeDepth(view.state.doc, posInfo.inside));
				if(innerInfo) {
					innerInfo.isList = innerNode.type.name === "list";
					return innerInfo;
				}
			}
		}

		const $pos = view.state.doc.resolve(posInfo.pos);
		for(let depth = $pos.depth; depth >= 1; depth--) {
			const node = $pos.node(depth);
			if(node.type.name !== "list") continue;
			const info = getBlockInfo(view, $pos.before(depth), node, depth);
			if(info) {
				info.isList = true;
				return info;
			}
		}
		for(let depth = $pos.depth; depth >= 1; depth--) {
			const node = $pos.node(depth);
			if(!node.isBlock || !(node.type.spec.atom || node.type.spec.draggable)) continue;
			const info = getBlockInfo(view, $pos.before(depth), node, depth);
			if(info) return info;
		}
		for(let depth = $pos.depth; depth >= 1; depth--) {
			const node = $pos.node(depth);
			if(!node.isBlock) continue;
			if(depth === 1) {
				const info = getBlockInfo(view, $pos.before(depth), node, depth);
				if(info) return info;
			}
		}

		if($pos.depth >= 1) {
			const blockPos = $pos.before(1);
			const blockNode = view.state.doc.nodeAt(blockPos);
			if(blockNode && blockNode.isBlock) {
				return getBlockInfo(view, blockPos, blockNode, 1);
			}
		}
	} catch(ex) {
		// ignore resolution errors
	}
	return null;
}

function findBlockAtCoords(view, coords) {
	const geometryInfo = findBlockByGeometry(view, coords);
	if(geometryInfo) return geometryInfo;

	const posInfo = view.posAtCoords(coords);
	return findBlockFromResolvedPosition(view, posInfo);
}

function resolveCurrentBlock(view, origPos, origNode) {
	try {
		const doc = view.state.doc;
		if(origPos < 0 || origPos >= doc.content.size) return null;
		const node = doc.nodeAt(origPos);
		if(node && node.type === origNode.type) {
			return { pos: origPos, node: node };
		}
	} catch(e) {
		// ignore
	}
	return null;
}

exports.HANDLE_POINTER_BRIDGE = HANDLE_POINTER_BRIDGE;
exports.HANDLE_HIT_GUTTER = HANDLE_HIT_GUTTER;
exports.lang = lang;
exports.getSvgIcon = getSvgIcon;
exports.isRTL = isRTL;
exports.isCoordsInEditorHandleZone = isCoordsInEditorHandleZone;
exports.findBlockAtCoords = findBlockAtCoords;
exports.resolveCurrentBlock = resolveCurrentBlock;
exports.getListHitBox = getListHitBox;
exports.getNodeDepth = getNodeDepth;