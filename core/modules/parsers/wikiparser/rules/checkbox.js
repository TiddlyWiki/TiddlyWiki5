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
	const checked = this.match[1] === "x" || this.match[1] === "X";
	return [{
		type: "checkbox",
		// start/end follow the standard TW5 AST convention: byte offsets of
		// this node's full extent within the source text.  For checkbox nodes
		// the extent is exactly the 3-character "[ ]" / "[x]" / "[X]" token.
		start: this.matchRegExp.lastIndex - this.match[0].length,
		end: this.matchRegExp.lastIndex,
		// checked: initial boolean state derived from the parsed syntax.
		checked
	}];
	// Note: sourceTitle is intentionally NOT stored on individual checkbox nodes.
	// It lives at the parse-root level via widget.parseSourceTitle (set by
	// wiki.makeWidget and TranscludeWidget) and is found at render time via
	// widget.getParseSourceTitle() traversal.
};
