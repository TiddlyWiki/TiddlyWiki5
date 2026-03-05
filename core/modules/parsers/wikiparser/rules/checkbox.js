/*\
title: $:/core/modules/parsers/wikiparser/rules/checkbox.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for checkboxes. For example:

[ ] Unchecked
[x] Checked
[X] Checked (alternative)

\*/

"use strict";

exports.name = "checkbox";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\[([ xX])\]/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	var checked = this.match[1] === "x" || this.match[1] === "X";
	var node = {
		type: "checkbox",
		// start/end follow the standard TW5 AST convention: byte offsets of
		// this node's full extent within the source text.  For checkbox nodes
		// the extent is exactly the 3-character "[ ]" / "[x]" / "[X]" token.
		start: this.matchRegExp.lastIndex - this.match[0].length,
		end: this.matchRegExp.lastIndex,
		// checked: initial boolean state derived from the parsed syntax.
		checked: checked
	};
	// sourceTitle is stored on the node when the parser knows which tiddler
	// it is parsing (set by parseTiddler or parseText with sourceTitle).
	// It is deliberately NOT set when parsing macro-expansion text or other
	// anonymous text, so that the widget can tell the offsets are invalid
	// for any real tiddler and should disable editing.
	if(this.parser.sourceTitle) {
		node.sourceTitle = this.parser.sourceTitle;
	}
	return [node];
};
