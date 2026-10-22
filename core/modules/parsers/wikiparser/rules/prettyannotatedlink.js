/*\
title: $:/core/modules/parsers/wikiparser/rules/prettyannotatedlink.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for pretty links with annotations. For example:

```
[link attribute="value" [Link description|TiddlerTitle]]
[link attribute="value" [TiddlerTitle]]
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "prettyannotatedlink";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
};

exports.findNextMatch = function(startPos) {
	// Find the next tag
	this.nextAnnotatedLink = this.findNextAnnotatedLink(this.parser.source,startPos);
	return this.nextAnnotatedLink ? this.nextAnnotatedLink.start : undefined;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.nextAnnotatedLink.end;
	if($tw.utils.isLinkExternal(this.nextAnnotatedLink.attributes.to)) {
		return [{
			type: "element",
			tag: "a",
			attributes: {
				href: {type: "string", value: link},
				"class": {type: "string", value: "tc-tiddlylink-external"},
				target: {type: "string", value: "_blank"},
				rel: {type: "string", value: "noopener noreferrer"},
        ...this.nextAnnotatedLink.attributes
			},
			children: [{
				type: "text", text: this.nextAnnotatedLink.text
			}]
		}];
	} else {
    return [{
      type: "link",
      attributes: this.nextAnnotatedLink.attributes,
      children: [{
        type: "text", text: this.nextAnnotatedLink.text
      }]
    }];
  }
};

/*
Find the next link from the current position
*/
exports.findNextAnnotatedLink = function(source,pos) {
	// A regexp for finding candidate HTML tags
	var reLookahead = /(\[link)/g;
	// Find the next candidate
	reLookahead.lastIndex = pos;
	var match = reLookahead.exec(source);
	while(match) {
		// Try to parse the candidate as a tag
		var tag = this.parseAnnotatedLink(source,match.index);
		// Return success
		if(tag) {
			return tag;
		}
		// Look for the next match
		reLookahead.lastIndex = match.index + 1;
		match = reLookahead.exec(source);
	}
	// Failed
	return null;
};

/*
Look for an link at the specified position. Returns null if not found, otherwise returns {type: "link", attributes: [], isSelfClosing:, start:, end:,}
*/
exports.parseAnnotatedLink = function(source,pos) {
	var token,
		node = {
			type: "link",
			start: pos,
			attributes: {},
      text: ""
		};
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Look for the `[img`
	token = $tw.utils.parseTokenString(source,pos,"[link");
	if(!token) {
		return null;
	}
	pos = token.end;
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Process attributes
	if(source.charAt(pos) !== "[") {
		var attribute = $tw.utils.parseAttribute(source,pos);
		while(attribute) {
			node.attributes[attribute.name] = attribute;
			pos = attribute.end;
			pos = $tw.utils.skipWhiteSpace(source,pos);
			if(source.charAt(pos) !== "[") {
				// Get the next attribute
				attribute = $tw.utils.parseAttribute(source,pos);
			} else {
				attribute = null;
			}
		}
	}
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Look for the `[` after the attributes
	token = $tw.utils.parseTokenString(source,pos,"[");
	if(!token) {
		return null;
	}
	pos = token.end;
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Get the source up to the terminating `]]`
	token = $tw.utils.parseTokenRegExp(source,pos,/(.*?)(?:\|(.*?))?\]\]/g);
	if(!token) {
		return null;
	}
	pos = token.end;
	var text = token.match[1],
		link = token.match[2] || text;
	node.attributes.to = {type: "string", value: link};
  node.text = text;
	// Update the end position
	node.end = pos;
	return node;
};

})();
