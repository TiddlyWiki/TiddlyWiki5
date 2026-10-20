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
	const classValue = node.attributes && node.attributes.class && node.attributes.class.value;
	const classes = typeof classValue === "string" ? classValue.split(/\s+/).filter((name) => name && name !== "tc-quote") : [];
	return {
		type: "blockquote",
		attrs: {
			cite: cite ? cite.map(shared.extractPlainText).join("") : null,
			twClasses: classes.length ? classes.join(" ") : null
		},
		content: shared.convertNodes(context, parts.body)
	};
};
