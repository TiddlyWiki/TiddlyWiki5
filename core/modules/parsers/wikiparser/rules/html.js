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
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "html";
exports.types = {inline: true, block: true};

exports.init = function(parser) {
	this.parser = parser;
};

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
	var tag = this.nextTag;
	this.nextTag = null;
	// Advance the parser position to past the tag
	this.parser.pos = tag.end;
	// Check for an immediately following double linebreak
	var hasLineBreak = !tag.isSelfClosing && !!$tw.utils.parseTokenRegExp(this.parser.source,this.parser.pos,/([^\S\n\r]*\r?\n(?:[^\S\n\r]*\r?\n|$))/g);
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
	}
	// Return the tag
	return [tag];
};

/*
Look for an HTML tag. Returns null if not found, otherwise returns {type: "element", name:, attributes: {}, orderedAttributes: [], isSelfClosing:, start:, end:,}
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
	var reTagName = /([a-zA-Z0-9\-\$\.]+)/g;
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
		token = $tw.utils.parseTokenRegExp(source,pos,/([^\S\n\r]*\r?\n(?:[^\S\n\r]*\r?\n|$))/g);
		if(!token) {
			return null;
		}
	}
	// Update the end position
	node.end = pos;
	return node;
};

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

})();
