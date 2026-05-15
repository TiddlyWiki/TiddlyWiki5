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
	const start = this.matchRegExp.lastIndex - this.match[0].length;
	const markerStart = start + 1;
	this.parser.pos = this.matchRegExp.lastIndex;
	const checked = this.match[1] !== " ";
	return [{
		type: "checkbox",
		// start/end cover the full token; markerStart/markerEnd isolate the
		// mutable X/space within it.
		start: start,
		end: this.matchRegExp.lastIndex,
		markerStart: markerStart,
		markerEnd: markerStart + 1,
		checked
	}];
};
