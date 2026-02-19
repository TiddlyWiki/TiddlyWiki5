/*\
title: $:/core/modules/parsers/wikiparser/rules/prettyextlink.js
type: application/javascript
module-type: wikirule
\*/

"use strict";

exports.name = "prettyextlink";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
};

exports.findNextMatch = function(startPos) {
	// Find the next tag
	this.nextLink = this.findNextLink(this.parser.source,startPos);
	return this.nextLink ? this.nextLink.start : undefined;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.nextLink.end;
	return [this.nextLink];
};

exports.findNextLink = function(source,pos) {
	// A regexp for finding candidate links
	var reLookahead = /(\[ext\[)/g;
	// Find the next candidate
	reLookahead.lastIndex = pos;
	var match = reLookahead.exec(source);
	while(match) {
		// Try to parse the candidate as a link
		var link = this.parseLink(source,match.index);
		// Return success
		if(link) {
			return link;
		}

		reLookahead.lastIndex = match.index + 1;
		match = reLookahead.exec(source);
	}

	return null;
};

exports.parseLink = function(source,pos) {
	var token,
		textNode = {
			type: "text"
		},
		node = {
			type: "element",
			tag: "a",
			start: pos,
			attributes: {
				"class": {type: "string", value: "tc-tiddlylink-external"},
			},
			children: [textNode]
		};
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Look for the `[ext[`
	token = $tw.utils.parseTokenString(source,pos,"[ext[");
	if(!token) {
		return null;
	}
	pos = token.end;
	// Look ahead for the terminating `]]`
	var closePos = source.indexOf("]]",pos);
	if(closePos === -1) {
		return null;
	}

	var splitPos = source.indexOf("|",pos);
	if(splitPos === -1 || splitPos > closePos) {
		splitPos = null;
	}

	var tooltip, URL, urlStart;
	textNode.start = pos;
	if(splitPos) {
		urlStart = splitPos + 1;
		URL = source.substring(splitPos + 1,closePos).trim();
		textNode.text = source.substring(pos,splitPos).trim();
		textNode.end = splitPos;
	} else {
		urlStart = pos;
		URL = source.substring(pos,closePos).trim();
		textNode.text = URL;
		textNode.end = closePos;
	}
	node.attributes.href = {type: "string", value: URL, start: urlStart, end: closePos};
	node.attributes.target = {type: "string", value: "_blank"};
	node.attributes.rel = {type: "string", value: "noopener noreferrer"};
	// Update the end position
	node.end = closePos + 2;
	return node;
};
