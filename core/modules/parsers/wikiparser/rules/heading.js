/*\
title: $:/core/modules/parsers/wikiparser/rules/heading.js
type: application/javascript
module-type: wikirule

Wiki text block rule for headings

\*/

/**
 * @typedef {import('../../base.js').ParseTreeAttribute} ParseTreeAttribute
 * @typedef {import('../../base.js').ParseTreeNode} ParseTreeNode
 * @typedef {import('../wikirulebase.js').WikiRuleBase} WikiRuleBase
 * @typedef {import('../../base.js').Parser} Parser
 */

/**
 * Parse tree node produced by the `heading` wiki rule.
 *
 * @example
 * `! My Heading` → `{ type: "element", tag: "h1", ... }`
 *
 * @typedef {Object} ParseTreeHeadingNode
 * @property {"element"} type - Widget type; headings render as HTML elements
 * @property {"heading"} rule - Parse rule that generated this node
 * @property {"h1" | "h2" | "h3" | "h4" | "h5" | "h6"} tag - Heading level tag
 * @property {number} start - Start position in source text
 * @property {number} end - End position in source text
 * @property {Object} attributes - Element attributes
 * @property {ParseTreeAttribute & { type: "string" }} attributes.class - CSS classes applied to the heading
 * @property {ParseTreeNode[]} children - Inline child nodes (the heading text)
 */

"use strict";

exports.name = "heading";
exports.types = {block: true};

/**
 * Initialise the heading rule with the given parser.
 *
 * @this {WikiRuleBase}
 * @param {Parser} parser
 * @returns {void}
 */
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /(!{1,6})/mg;
};

/**
 * Parse the most recent heading match.
 *
 * @this {WikiRuleBase}
 * @returns {ParseTreeHeadingNode[]} Array containing a single heading element node
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
