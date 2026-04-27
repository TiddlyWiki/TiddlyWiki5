/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/hard-breaks.js
type: application/javascript
module-type: library
\*/

"use strict";

function buildHorizRule() {
	return { type: "horizontal_rule" };
}

function buildBr() {
	return { type: "hard_break" };
}

exports.buildHorizRule = buildHorizRule;
exports.buildBr = buildBr;
