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
	const classes = ["tc-quote"];
	// Get all the details of the match
	const reEndString = `${String.raw`^\s*` + this.match[1]}(?!<)`;
	// Move past the <s
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse any classes, whitespace and then the optional cite itself
	const classStart = this.parser.pos;
	classes.push.apply(classes,this.parser.parseClasses());
	const classEnd = this.parser.pos;
	this.parser.skipWhitespace({treatNewlinesAsNonWhitespace: true});
	let citeStart = this.parser.pos;
	let cite = this.parser.parseInlineRun(/(\r?\n)/mg);
	let citeEnd = this.parser.pos;
	// before handling the cite, parse the body of the quote
	const tree = this.parser.parseBlocks(reEndString);
	// If we got a cite, put it before the text
	if(cite.length > 0) {
		tree.unshift({
			type: "element",
			tag: "cite",
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
			children: cite,
			start: citeStart,
			end: citeEnd
		});
	}
	// Return the blockquote element
	return [{
		type: "element",
		tag: "blockquote",
		attributes: {
			class: {type: "string",value: classes.join(" "),start: classStart,end: classEnd},
		},
		children: tree
	}];
};
