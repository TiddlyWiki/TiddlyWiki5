/*\
title: $:/plugins/tiddlywiki/prosemirror/features/drag-handle/helpers.js
type: application/javascript
module-type: library

Shared helpers for the ProseMirror drag handle feature.

\*/

"use strict";

const HANDLE_POINTER_BRIDGE = 28;

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

function findBlockAtCoords(view, coords) {
	const posInfo = view.posAtCoords(coords);
	if(!posInfo) return null;

	try {
		if(posInfo.inside >= 0) {
			try {
				const innerNode = view.state.doc.nodeAt(posInfo.inside);
				if(innerNode && innerNode.isBlock) {
					const innerDom = view.nodeDOM(posInfo.inside);
					if(innerDom && innerDom.nodeType === 1) {
						return { pos: posInfo.inside, node: innerNode, dom: innerDom, depth: 1 };
					}
				}
			} catch(ex) { /* ignore */ }
		}

		const $pos = view.state.doc.resolve(posInfo.pos);
		for(let depth = $pos.depth; depth >= 1; depth--) {
			const node = $pos.node(depth);
			const pos = $pos.before(depth);
			if(!node.isBlock) continue;
			if(node.type.name === "list") {
				const dom = view.nodeDOM(pos);
				if(dom && dom.nodeType === 1) {
					return { pos: pos, node: node, dom: dom, depth: depth };
				}
			}
			if(depth === 1) {
				const dom1 = view.nodeDOM(pos);
				if(dom1 && dom1.nodeType === 1) {
					return { pos: pos, node: node, dom: dom1, depth: depth };
				}
			}
			if(node.type.spec.atom || node.type.spec.draggable) {
				const domA = view.nodeDOM(pos);
				if(domA && domA.nodeType === 1) {
					return { pos: pos, node: node, dom: domA, depth: depth };
				}
			}
		}

		if($pos.depth >= 1) {
			const blockPos = $pos.before(1);
			const blockNode = view.state.doc.nodeAt(blockPos);
			if(blockNode && blockNode.isBlock) {
				const domF = view.nodeDOM(blockPos);
				if(domF && domF.nodeType === 1) {
					return { pos: blockPos, node: blockNode, dom: domF, depth: 1 };
				}
			}
		}
	} catch(ex) {
		// ignore resolution errors
	}
	return null;
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
exports.lang = lang;
exports.getSvgIcon = getSvgIcon;
exports.isRTL = isRTL;
exports.findBlockAtCoords = findBlockAtCoords;
exports.resolveCurrentBlock = resolveCurrentBlock;