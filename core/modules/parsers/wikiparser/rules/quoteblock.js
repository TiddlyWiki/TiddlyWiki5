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
	// Parsing the cite runs other rules against this rule instance, so the match details get read before that happens
	var quoteStart = this.match.index,
		quoteMarker = this.match[1];
	// Get all the details of the match
	var reEndString = "^\\s*" + quoteMarker + "(?!<)";
	// Move past the <s
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse any classes, whitespace and then the optional cite itself
	var classStart = this.parser.pos;
	classes.push.apply(classes, this.parser.parseClasses());
	var classEnd = this.parser.pos;
	this.parser.skipWhitespace({treatNewlinesAsNonWhitespace: true});
	var citeStart = this.parser.pos;
	var cite = this.parser.parseInlineRun(/(\r?\n)/mg);
	var citeEnd = this.parser.pos;
	if(!this.parser.hasCloser(new RegExp(reEndString,"mg"))) {
		this.parser.addDiagnostic({
			from: quoteStart,
			to: this.parser.pos,
			severity: "warning",
			code: "unterminated-quoteblock",
			message: "Missing closing " + quoteMarker + " for the quote block, so it runs to the end of the tiddler"
		});
	}
	// before handling the cite, parse the body of the quote
	var tree = this.parser.parseBlocks(reEndString);
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
			class: { type: "string", value: classes.join(" "), start: classStart, end: classEnd },
		},
		children: tree
	}];
};
