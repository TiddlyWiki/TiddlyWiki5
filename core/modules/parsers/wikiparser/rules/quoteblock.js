/*\
title: $:/core/modules/parsers/wikiparser/rules/quoteblock.js
type: application/javascript
module-type: wikirule

Wiki text rule for quote blocks.

\*/

"use strict";

exports.name = "quoteblock";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /(<<<+)/mg;
};

exports.parse = function() {
	var classes = ["tc-quote"];
	// Get all the details of the match
	var reEndString = "^\\s*" + this.match[1] + "(?!<)";
	// Move past the <s
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse any classes, whitespace and then the optional cite itself
	var classStart = this.parser.pos;
	var userClasses = this.parser.parseClasses();
	classes.push.apply(classes, userClasses);
	var classEnd = this.parser.pos;
	this.parser.skipWhitespace({treatNewlinesAsNonWhitespace: true});
	var citeStart = this.parser.pos;
	var cite = this.parser.parseInlineRun(/(\r?\n)/mg);
	var citeEnd = this.parser.pos;
	// before handling the cite, parse the body of the quote
	var tree = this.parser.parseBlocks(reEndString);
	// If we got a cite, put it before the text
	if(cite.length > 0) {
		tree.unshift({
			type: "element",
			tag: "cite",
			isQuoteCite: true,
			children: cite,
			start: citeStart,
			end: citeEnd
		});
	}
	// Parse any optional cite
	this.parser.skipWhitespace({treatNewlinesAsNonWhitespace: true});
	citeStart = this.parser.pos;
	cite = this.parser.parseInlineRun(/(\r?\n)/mg);
	citeEnd = this.parser.pos;
	// If we got a cite, push it
	if(cite.length > 0) {
		tree.push({
			type: "element",
			tag: "cite",
			isQuoteCite: true,
			children: cite,
			start: citeStart,
			end: citeEnd
		});
	}
	// Return the blockquote element; the marker depth and the raw class list
	// are not recoverable from the class attribute, which fuses the classes
	// with the synthesized tc-quote
	return [{
		type: "element",
		tag: "blockquote",
		marker: this.match[1],
		userClasses: userClasses,
		attributes: {
			class: { type: "string", value: classes.join(" "), start: classStart, end: classEnd },
		},
		children: tree
	}];
};
