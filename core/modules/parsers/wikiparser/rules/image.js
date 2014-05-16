/*\
title: $:/core/modules/parsers/wikiparser/rules/image.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for embedding images. For example:

```
[img[http://tiddlywiki.com/fractalveg.jpg]]
[img width=23 height=24 [http://tiddlywiki.com/fractalveg.jpg]]
[img width={{!!width}} height={{!!height}} [http://tiddlywiki.com/fractalveg.jpg]]
[img[Description of image|http://tiddlywiki.com/fractalveg.jpg]]
[img[TiddlerTitle]]
[img[Description of image|TiddlerTitle]]
```

Generates the `<$image>` widget.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "image";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
};

exports.findNextMatch = function(startPos) {
	// Find the next tag
	this.nextImage = this.findNextImage(this.parser.source,startPos);
	return this.nextImage ? this.nextImage.start : undefined;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.nextImage.end;
	var node = {
		type: "image",
		attributes: this.nextImage.attributes
	};
	return [node];
};

/*
Find the next image from the current position
*/
exports.findNextImage = function(source,pos) {
	// A regexp for finding candidate HTML tags
	var reLookahead = /(\[img)/g;
	// Find the next candidate
	reLookahead.lastIndex = pos;
	var match = reLookahead.exec(source);
	while(match) {
		// Try to parse the candidate as a tag
		var tag = this.parseImage(source,match.index);
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
Look for an image at the specified position. Returns null if not found, otherwise returns {type: "image", attributes: [], isSelfClosing:, start:, end:,}
*/
exports.parseImage = function(source,pos) {
	var token,
		node = {
			type: "image",
			start: pos,
			attributes: {}
		};
	// Skip whitespace
	pos = $tw.utils.skipWhiteSpace(source,pos);
	// Look for the `[img`
	token = $tw.utils.parseTokenString(source,pos,"[img");
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
	token = $tw.utils.parseTokenRegExp(source,pos,/(?:([^|\]]*?)\|)?([^\]]+?)\]\]/g);
	if(!token) {
		return null;
	}
	pos = token.end;
	if(token.match[1]) {
		node.attributes.tooltip = {type: "string", value: token.match[1].trim()};
	}
	node.attributes.source = {type: "string", value: (token.match[2] || "").trim()};
	// Update the end position
	node.end = pos;
	return node;
};

})();
