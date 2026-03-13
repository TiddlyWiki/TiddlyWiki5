/*\
title: $:/core/modules/parsers/wikiparser/rules/codeblock.js
type: application/javascript
module-type: wikirule

Wiki text rule for code blocks. For example:

```
	```
	This text will not be //wikified//
	```
```

\*/

/**
 * @typedef {import('../../base.js').ParseTreeAttribute} ParseTreeAttribute
 * @typedef {import('../wikirulebase.js').WikiRuleBase} WikiRuleBase
 * @typedef {import('../../base.js').Parser} Parser
 */

/**
 * Parse tree node produced by the `codeblock` wiki rule.
 *
 * Example wiki text that produces this node:
 * ```
 * ```javascript
 * const x = 1;
 * ```
 * ```
 *
 * @typedef {Object} ParseTreeCodeblockNode
 * @property {"codeblock"} type - Widget type identifier
 * @property {"codeblock"} rule - Parse rule that generated this node
 * @property {number} start - Start position in source text
 * @property {number} end - End position in source text
 * @property {Object} attributes - Widget attributes
 * @property {ParseTreeAttribute & { type: "string", value: string }} attributes.code - The code content
 * @property {ParseTreeAttribute & { type: "string", value: string }} attributes.language - The language specifier (may be empty string)
 */

"use strict";

exports.name = "codeblock";
exports.types = {block: true};

/**
 * Initialise the codeblock rule with the given parser.
 *
 * @this {WikiRuleBase}
 * @param {Parser} parser
 * @returns {void}
 */
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match and get language if defined
	this.matchRegExp = /```([\w-]*)\r?\n/mg;
};

/**
 * Parse the most recent code block match.
 *
 * @this {WikiRuleBase}
 * @returns {ParseTreeCodeblockNode[]} Array containing a single codeblock node
 */
exports.parse = function() {
	var reEnd = /(\r?\n```$)/mg;
	var languageStart = this.parser.pos + 3,
		languageEnd = languageStart + this.match[1].length;
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;

	// Look for the end of the block
	reEnd.lastIndex = this.parser.pos;
	var match = reEnd.exec(this.parser.source),
		text,
		codeStart = this.parser.pos;
	// Process the block
	if(match) {
		text = this.parser.source.substring(this.parser.pos,match.index);
		this.parser.pos = match.index + match[0].length;
	} else {
		text = this.parser.source.substr(this.parser.pos);
		this.parser.pos = this.parser.sourceLength;
	}
	// Return the $codeblock widget
	return [{
		type: "codeblock",
		attributes: {
			code: {type: "string", value: text, start: codeStart, end: this.parser.pos},
			language: {type: "string", value: this.match[1], start: languageStart, end: languageEnd}
		}
	}];
};
