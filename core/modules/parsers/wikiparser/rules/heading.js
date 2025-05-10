/*\
title: $:/core/modules/parsers/wikiparser/rules/heading.js
type: application/javascript
module-type: wikirule

Wiki text block rule for headings

\*/

"use strict";

exports.name = "heading";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /(!{1,6})/mg;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Get all the details of the match
	var headingLevel = this.match[1].length;
	// Move past the !s
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse any classes, whitespace and then the heading itself
	var classStart = this.parser.pos;
	var classes = this.parser.parseClasses();
	var classEnd = this.parser.pos;
	this.parser.skipWhitespace({treatNewlinesAsNonWhitespace: true});
	var tree = this.parser.parseInlineRun(/(\r?\n)/mg);
	// Return the heading
	return [{
		type: "element",
		tag: "h" + headingLevel,
		attributes: {
			"class": {type: "string", value: classes.join(" "), start: classStart, end: classEnd}
		},
		children: tree
	}];
};
