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
	return [{
		type: "checkbox",
		// start/end are the standard AST position fields: the byte offsets of
		// the [ ] or [x] syntax within the source text being parsed.
		// The checkbox widget uses these directly to splice the text on click.
		start: this.matchRegExp.lastIndex - this.match[0].length,
		end: this.matchRegExp.lastIndex,
		// sourceTitle: the tiddler whose .text field contains this checkbox.
		// Placed here (not in attributes) because it's parse-time metadata,
		// not a reactive widget parameter.
		sourceTitle: this.parser.sourceTitle,
		// checked: initial boolean state from the parsed syntax.
		checked: checked
	}];
};
