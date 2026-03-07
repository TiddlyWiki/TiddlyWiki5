/*\
title: $:/core/modules/parsers/wikiparser/rules/anchor.js
type: application/javascript
module-type: wikirule

Inline rule for anchor syntax. Matches ` ^id` at the end of a line and
produces an anchor node with `name: "true"` — a "name anchor".

Name anchors consume the `^id` text so it does not appear in rendered
output. After `parseBlock()` returns, `$tw.utils.wrapAnchorsInTree()`
finds these name anchors and wraps the enclosing block in a "target
anchor" container.

The name anchor also serves as the serialization source — the anchor
serializer outputs ` ^id` for name anchors and is transparent for
target anchors.

\*/

"use strict";

exports.name = "anchor";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Match " ^id" at the end of a line (or at end of string).
	// The id is any non-whitespace sequence not containing ^.
	// Requires at least one horizontal whitespace char before ^.
	this.matchRegExp = /[ \t]\^([^\s\^]+)(?=[ \t]*(?:\r?\n|$))/mg;
};

exports.parse = function() {
	var anchorId = this.match[1];
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Return a name anchor — an empty anchor node that marks this position.
	// wrapAnchorsInTree() will later promote this into a target container.
	return [{
		type: "anchor",
		attributes: {
			id: {type: "string", value: anchorId},
			name: {type: "string", value: "true"}
		},
		children: [],
		isBlock: false
	}];
};
