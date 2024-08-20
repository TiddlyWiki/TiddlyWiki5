// @ts-check
/**
title: $:/core/modules/parsers/wikiparser/rules/codeblock.js
type: application/javascript
module-type: wikirule

Wiki text rule for code blocks. For example:

```
	```
	This text will not be //wikified//
	```
```

@module $:/core/modules/parsers/wikiparser/rules/codeblock.js

\*/

/**
 * Represents the `codeblock` rule.
 * 
 * @typedef {Object} CodeblockNode
 * @property {string} type - The type of the widget, which is "codeblock".
 * @property {Object} attributes - The attributes of the codeblock.
 * @property {Object} attributes.code - The code attribute object.
 * @property {string} attributes.code.type - The type of the code attribute, which is "string".
 * @property {string} attributes.code.value - The actual code content within the code block.
 * @property {number} attributes.code.start - The start position of the code in the source text.
 * @property {number} attributes.code.end - The end position of the code in the source text.
 * @property {Object} attributes.language - The language attribute object.
 * @property {string} attributes.language.type - The type of the language attribute, which is "string".
 * @property {string} attributes.language.value - The language specified after the triple backticks, if any.
 * @property {number} attributes.language.start - The start position of the language string in the source text.
 * @property {number} attributes.language.end - The end position of the language string in the source text.
 */

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "codeblock";
exports.types = {block: true};

/**
 * Initializes the codeblock rule with the given parser.
 * 
 * @param {Object} parser - The parser object that manages the state of the parsing process.
 */
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match and get language if defined
	this.matchRegExp = /```([\w-]*)\r?\n/mg;
};

/**
 * Parses the code block and returns an array of `codeblock` widgets.
 * 
 * @returns {CodeblockNode[]} An array containing a single codeblock widget object.
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

})();
