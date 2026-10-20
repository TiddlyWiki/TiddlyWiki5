/*\
title: $:/plugins/tiddlywiki/prosemirror/blocks/source-utils.js
type: application/javascript
module-type: library
\*/

"use strict";

const serializeWithPreservedSource = require("$:/plugins/tiddlywiki/prosemirror/ast/source-preservation.js").serializeWithPreservedSource;
const serializeProseMirrorNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/serialize-wikitext.js").serializeProseMirrorNodes;

function getNodeWikiText(node) {
	return serializeWithPreservedSource({ type: "doc", content: [node.toJSON()] },serializeProseMirrorNodes);
}

function replaceNodeWithOpaqueSource(view, getPos, node) {
	if(!view || !view.state || !view.state.schema || !view.state.schema.nodes.opaque_block) {
		return false;
	}
	const pos = getPos && getPos();
	if(typeof pos !== "number") {
		return false;
	}
	const rawText = getNodeWikiText(node);
	const firstLine = rawText.split("\n")[0] || rawText;
	const opaqueNode = view.state.schema.nodes.opaque_block.create({
		rawText: rawText,
		firstLine: firstLine.trim(),
		parseTreeJson: null,
		autoEdit: true
	});
	view.dispatch(view.state.tr.replaceWith(pos, pos + node.nodeSize, opaqueNode));
	view.focus();
	return true;
}

exports.getNodeWikiText = getNodeWikiText;
exports.replaceNodeWithOpaqueSource = replaceNodeWithOpaqueSource;
