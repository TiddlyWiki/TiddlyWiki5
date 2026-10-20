/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/blockquote.js
type: application/javascript
module-type: library
\*/

"use strict";

const shared = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js");
const factory = $tw.utils.wikitextParseTree;

module.exports = function buildBlockquote(context, node) {
	const parts = factory.quoteParts(node);
	// The editor shows one citation; the closing one wins as it did before
	const cite = parts.closingCite || parts.openingCite;
	return {
		type: "blockquote",
		attrs: { cite: cite ? cite.map(shared.extractPlainText).join("") : null },
		content: shared.convertNodes(context, parts.body)
	};
};
