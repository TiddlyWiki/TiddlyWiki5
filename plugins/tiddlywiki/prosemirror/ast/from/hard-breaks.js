/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/hard-breaks.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertNodes;
const factory = $tw.utils.wikitextParseTree;

function horizontalRule() {
	return factory.horizontalRule();
}

// Two spaces and a backslash before the line end, the ssnl rule of the hard-line-breaks plugin, see #10025
function hardBreak() {
	return factory.hardBreak();
}

function hardLineBreaksBlock(builders, node) {
	// The editor's breaks split the region into its lines
	const lines = [[]];
	convertNodes(builders, node.content || []).forEach((child) => {
		if(factory.kindOf(child) === "hardBreak") {
			lines.push([]);
		} else {
			lines[lines.length - 1].push(child);
		}
	});
	return factory.paragraph([factory.hardLineBreaksRegion(lines)]);
}

exports.horizontalRule = horizontalRule;
exports.hardBreak = hardBreak;
exports.hardLineBreaksBlock = hardLineBreaksBlock;
