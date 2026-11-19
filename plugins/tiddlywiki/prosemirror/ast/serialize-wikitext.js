/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/serialize-wikitext.js
type: application/javascript
module-type: library

Serialize editor nodes through the public WikiText serializer. The serializer
owns syntax and block separators; this adapter only supplies document context.

\*/

"use strict";

const wikiAstFromProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/from-prosemirror.js").from;

function serializeWikiAst(tree, options) {
	const nodes = Array.isArray(tree) ? tree : [tree];
	let output = $tw.utils.serializeWikitextParseTree(nodes);
	// A group inside a document only needs the one extra newline represented
	// by its leading blank line, rather than two document-leading newlines.
	if(options && options.atDocumentStart === false && nodes[0] && nodes[0].rule === "blankline") {
		output = output.substring(1);
	}
	return output;
}

function serializeProseMirrorNodes(nodes, options) {
	return serializeWikiAst(wikiAstFromProseMirrorAst(nodes), options);
}

exports.serializeWikiAst = serializeWikiAst;
exports.serializeProseMirrorNodes = serializeProseMirrorNodes;
