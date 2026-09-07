/*\
title: $:/plugins/tiddlywiki/prosemirror/blocks/source-utils.js
type: application/javascript
module-type: library
\*/

"use strict";

const wikiAstFromProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/from-prosemirror.js").from;

function getNodeWikiText(node) {
	const wikiAst = wikiAstFromProseMirrorAst(node.toJSON());
	return $tw.utils.serializeWikitextParseTree(wikiAst).trimEnd();
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