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
	this.matchRegExp = /\[([ xX])\]/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	const checked = this.match[1] === "x" || this.match[1] === "X";
	return [{
		type: "checkbox",
		start: this.matchRegExp.lastIndex - this.match[0].length,
		end: this.matchRegExp.lastIndex,
		checked
	}];
};
