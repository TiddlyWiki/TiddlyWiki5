/*\
title: $:/core/modules/parsers/wikiparser/rules/html.js
type: application/javascript
module-type: wikirule

Wiki rule for HTML elements and widgets. For example:

{{{
<aside>
This is an HTML5 aside element
</aside>

<$slider target="MyTiddler">
This is a widget invocation
</$slider>

}}}

\*/

/**
 * @typedef {import('../../base.js').ParseTreeAttribute} ParseTreeAttribute
 * @typedef {import('../wikirulebase.js').WikiRuleBase} WikiRuleBase
 * @typedef {import('../../base.js').Parser} Parser
 */

/**
 * Parse tree node produced by the `html` wiki rule.
 *
 * Represents a parsed HTML or widget element tag.
 *
 * @typedef {Object} ParseTreeHtmlNode
 * @property {"element"} type - Widget type; always `"element"` for HTML tags
 * @property {"html"} rule - Parse rule that generated this node
 * @property {keyof HTMLElementTagNameMap | string} tag - Tag name (e.g. `"div"`, `"$link"`)
 * @property {number} start - Start position in source text
 * @property {number} end - End position in source text
 * @property {Record<string, ParseTreeAttribute>} attributes - Element attributes
 * @property {Array<{ name: string } & ParseTreeAttribute>} orderedAttributes - Attributes in source order
 * @property {boolean} isSelfClosing - Whether the tag is self-closing (e.g. `<br/>`)
 * @property {boolean} [isBlock] - Whether the element is rendered as a block
 * @property {number} [openTagStart] - Start position of the opening tag
 * @property {number} [openTagEnd] - End position of the opening tag
 * @property {number} [closeTagStart] - Start position of the closing tag
 * @property {number} [closeTagEnd] - End position of the closing tag
 * @property {ParseTreeHtmlNode[]} [children] - Child parse tree nodes (for non-void elements)
 */

"use strict";

exports.name = "html";
exports.types = {inline: true, block: true};

/**
 * Initialise the html rule with the given parser.
 *
 * @this {WikiRuleBase}
 * @param {Parser} parser
 * @returns {void}
 */
exports.init = function(parser) {
	this.parser = parser;
};

/**
 * Find the next position in the source where an HTML or widget tag occurs.
 *
 * @this {WikiRuleBase & { nextTag?: ParseTreeHtmlNode | null }}
 * @param {number} startPos - Position to start searching from
 * @returns {number | undefined} Start position of the next tag, or `undefined`
 */
exports.findNextMatch = function(startPos) {
	// Find the next tag
	this.nextTag = this.findNextTag(this.parser.source,startPos,{
		requireLineBreak: this.is.block
	});
	return this.nextTag ? this.nextTag.start : undefined;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Retrieve the most recent match so that recursive calls don't overwrite it
	/** @type {ParseTreeHtmlNode} */
	var tag = this.nextTag;
	if(!tag.isSelfClosing) {
		tag.openTagStart = tag.start;
		tag.openTagEnd = tag.end;
	}
	this.nextTag = null;
	// Advance the parser position to past the tag
	this.parser.pos = tag.end;
	// Check for an immediately following double linebreak
	var hasLineBreak = !tag.isSelfClosing && !!$tw.utils.parseTokenRegExp(this.parser.source,this.parser.pos,/([^\S\n\r]*\r?\n(?:[^\S\n\r]*\r?\n|$))/y);
	// Set whether we're in block mode
	tag.isBlock = this.is.block || hasLineBreak;
	// Parse the body if we need to
	if(!tag.isSelfClosing && $tw.config.htmlVoidElements.indexOf(tag.tag) === -1) {
		var reEndString = "</" + $tw.utils.escapeRegExp(tag.tag) + ">";
		if(hasLineBreak) {
			tag.children = this.parser.parseBlocks(reEndString);
		} else {
			var reEnd = new RegExp("(" + reEndString + ")","mg");
			tag.children = this.parser.parseInlineRun(reEnd,{eatTerminator: true});
		}
		tag.end = this.parser.pos;
		tag.closeTagEnd = tag.end;
		if(tag.closeTagEnd === tag.openTagEnd || this.parser.source[tag.closeTagEnd - 1] !== ">") {
			tag.closeTagStart = tag.end;
		} else {
			tag.closeTagStart = tag.closeTagEnd - 2;
			var closeTagMinPos = tag.children.length > 0 ? tag.children[tag.children.length-1].end : tag.openTagEnd;
			if(!Number.isSafeInteger(closeTagMinPos)) closeTagMinPos = tag.openTagEnd;
			while(tag.closeTagStart >= closeTagMinPos) {
				var char = this.parser.source[tag.closeTagStart];
				if(char === ">") {
					tag.closeTagStart = -1;
					break;
				}
				if(char === "<") break;
				tag.closeTagStart -= 1;
			}
			if(tag.closeTagStart < closeTagMinPos) {
				tag.closeTagStart = tag.end;
			}
		}
	}
	// Return the tag
	return [tag];
};

/**
 * Parse an HTML/widget opening tag at the given position.
 * Returns `null` if no valid tag is found.
 *
 * @this {WikiRuleBase}
 * @param {string} source - Full source text
 * @param {number} pos - Position to start parsing from
 * @param {Object} [options]
 * @param {boolean} [options.requireLineBreak=false] - If true, tag must be followed by a blank line
 * @returns {ParseTreeHtmlNode | null} Parsed tag node, or `null`
 */
exports.parseTag = function(source,pos,options) {
	options = options || {};
	var token,
		node = {
			type: "element",
			start: pos,
			attributes: {},
			orderedAttributes: []
		};
	// Define our regexps
	const reTagName = /([a-zA-Z0-9\-\$\.]+)/y;
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Look for a less than sign
	token = $tw.utils.parseTokenString(source,pos,"<");
	if(!token) {
		return null;
	}
	pos = token.end;
	// Get the tag name
	token = $tw.utils.parseTokenRegExp(source,pos,reTagName);
	if(!token) {
		return null;
	}
	node.tag = token.match[1];
	if(node.tag.charAt(0) === "$") {
		node.type = node.tag.substr(1);
	}
	pos = token.end;
	// Check that the tag is terminated by a space, / or >
	if(!$tw.utils.parseWhiteSpace(source,pos) && !(source.charAt(pos) === "/") && !(source.charAt(pos) === ">") ) {
		return null;
	}
	// Process attributes
	var attribute = $tw.utils.parseAttribute(source,pos);
	while(attribute) {
		node.orderedAttributes.push(attribute);
		node.attributes[attribute.name] = attribute;
		pos = attribute.end;
		// Get the next attribute
		attribute = $tw.utils.parseAttribute(source,pos);
	}
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Look for a closing slash
	token = $tw.utils.parseTokenString(source,pos,"/");
	if(token) {
		pos = token.end;
		node.isSelfClosing = true;
	}
	// Look for a greater than sign
	token = $tw.utils.parseTokenString(source,pos,">");
	if(!token) {
		return null;
	}
	pos = token.end;
	// Check for a required line break
	if(options.requireLineBreak) {
		token = $tw.utils.parseTokenRegExp(source,pos,/([^\S\n\r]*\r?\n(?:[^\S\n\r]*\r?\n|$))/y);
		if(!token) {
			return null;
		}
	}
	// Update the end position
	node.end = pos;
	return node;
};

/**
 * Find the next valid HTML or widget tag in the source, searching forward
 * from `pos`.
 *
 * @this {WikiRuleBase}
 * @param {string} source - Full source text
 * @param {number} pos - Start search position
 * @param {Object} [options]
 * @param {boolean} [options.requireLineBreak=false] - Passed through to `parseTag`
 * @returns {ParseTreeHtmlNode | null} Next valid tag, or `null` if none found
 */
exports.findNextTag = function(source,pos,options) {
	// A regexp for finding candidate HTML tags
	var reLookahead = /<([a-zA-Z\-\$\.]+)/g;
	// Find the next candidate
	reLookahead.lastIndex = pos;
	var match = reLookahead.exec(source);
	while(match) {
		// Try to parse the candidate as a tag
		var tag = this.parseTag(source,match.index,options);
		// Return success
		if(tag && this.isLegalTag(tag)) {
			return tag;
		}
		// Look for the next match
		reLookahead.lastIndex = match.index + 1;
		match = reLookahead.exec(source);
	}
	// Failed
	return null;
};

/**
 * Check whether a parsed tag is a legal HTML element or widget.
 * Widgets (tag names starting with `$`) are always legal;
 * HTML tags starting with `-` are not.
 *
 * @this {WikiRuleBase}
 * @param {ParseTreeHtmlNode} tag - Parsed tag to validate
 * @returns {boolean} `true` if the tag is legal
 */
exports.isLegalTag = function(tag) {
	// Widgets are always OK
	if(tag.type !== "element") {
		return true;
	// If it's an HTML tag that starts with a dash then it's not legal
	} else if(tag.tag.charAt(0) === "-") {
		return false;
	} else {
		// Otherwise it's OK
		return true;
	}
};
