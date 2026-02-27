/*\
title: $:/core/modules/parsers/wikiparser/rules/quoteblock.js
type: application/javascript
module-type: wikirule

Wiki text rule for quote blocks.

\*/

/**
 * @typedef {import('../../base.js').ParseTreeAttribute} ParseTreeAttribute
 * @typedef {import('../../base.js').ParseTreeNode} ParseTreeNode
 * @typedef {import('../wikirulebase.js').WikiRuleBase} WikiRuleBase
 * @typedef {import('../../base.js').Parser} Parser
 */

/**
 * Parse tree node produced by the `quoteblock` wiki rule.
 *
 * @example
 * ```
 * <<<
 * This is a blockquote
 * <<< Optional citation
 * ```
 *
 * @typedef {Object} ParseTreeQuoteBlockNode
 * @property {"element"} type - Widget type
 * @property {"quoteblock"} rule - Parse rule that generated this node
 * @property {"blockquote"} tag - Always renders as `<blockquote>`
 * @property {number} start
 * @property {number} end
 * @property {Object} attributes
 * @property {ParseTreeAttribute & { type: "string" }} attributes.class - CSS classes (always includes `"tc-quote"`)
 * @property {ParseTreeNode[]} children - Block content and optional `<cite>` elements
 */

"use strict";

exports.name = "quoteblock";
exports.types = {block: true};

/**
 * Initialise the quoteblock rule.
 *
 * @this {WikiRuleBase}
 * @param {Parser} parser
 * @returns {void}
 */
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /(<<<+)/mg;
};

/**
 * Parse the most recent quoteblock match.
 *
 * @this {WikiRuleBase}
 * @returns {ParseTreeQuoteBlockNode[]} Array containing a single blockquote node
 */
exports.parse = function() {
	var classes = ["tc-quote"];
	// Get all the details of the match
	var reEndString = "^\\s*" + this.match[1] + "(?!<)";
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
