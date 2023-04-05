/*\
title: $:/plugins/tiddlywiki/dynannotate/textmap.js
type: application/javascript
module-type: library

Structure for modelling mapping between a string and its representation in the DOM

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var PREFIX_SUFFIX_LENGTH = 50;

/*
Build a map of the text content of a dom node and its descendents:

string: concatenation of the text content of child nodes
metadata: array of {start,end,domNode} where start and end identify position in the string
*/
exports.TextMap = function(domNode) {
	var self = this,
		stringChunks = [],
		p = 0;
	this.metadata = [];
	var processNode = function(domNode) {
		// Check for text nodes
		if(domNode.nodeType === 3) {
			var text = domNode.textContent;
			stringChunks.push(text);
			self.metadata.push({
				start: p,
				end: p + text.length,
				domNode: domNode
			});
			p += text.length;
		} else {
			// Otherwise look within the child nodes
			if(domNode.childNodes) {
				for(var t=0; t<domNode.childNodes.length; t++ ) {
					processNode(domNode.childNodes[t]);
				}
			}
		}
	};
	// Process our text nodes
	processNode(domNode);
	this.string = stringChunks.join("");
};

/*
Locate the metadata record corresponding to a given position in the string
*/
exports.TextMap.prototype.locateMetadata = function(position) {
	return this.metadata.find(function(metadata) {
		return position >= metadata.start && position < metadata.end;
	});
};

/*
Search for the first occurance of a target string within the textmap of a dom node

Returns an object with the following properties:
	startNode: node containing the start of the text
	startOffset: offset of the start of the text within the node
	endNode: node containing the end of the text
	endOffset: offset of the end of the text within the node
*/
exports.TextMap.prototype.findText = function(targetString,targetPrefix,targetSuffix) {
	if(!targetString) {
		return null;
	}
	targetPrefix = targetPrefix || "";
	targetSuffix = targetSuffix || "";
	var startPos = this.string.indexOf(targetPrefix + targetString + targetSuffix);
	if(startPos !== -1) {
		startPos += targetPrefix.length;
		var startMetadata = this.locateMetadata(startPos),
			endMetadata = this.locateMetadata(startPos + targetString.length - 1);
		if(startMetadata && endMetadata) {
			return {
				startNode: startMetadata.domNode,
				startOffset: startPos - startMetadata.start,
				endNode: endMetadata.domNode,
				endOffset: (startPos + targetString.length) - endMetadata.start
			}			
		}
	}
	return null;
};

/*
Search for all occurances of a string within the textmap of a dom node

Options include:
	mode: "normal", "regexp" or "whitespace"
	caseSensitive: true if the search should be case sensitive

Returns an array of objects with the following properties:
	startPos: start position of the match within the string contained by this TextMap
	startNode: node containing the start of the text
	startOffset: offset of the start of the text within the node
	endPos: end position of the match within the string contained by this TextMap
	endNode: node containing the end of the text
	endOffset: offset of the end of the text within the node
*/
exports.TextMap.prototype.search = function(searchString,options) {
	if(!searchString) {
		return [];
	}
	options = options || {};
	// Compose the regexp
	var regExpString,
		flags = options.caseSensitive ? "g" : "gi";
	if(options.mode === "regexp") {
		regExpString = "(" + searchString + ")";
	} else if(options.mode === "whitespace") {
		// Normalise whitespace
		regExpString = "(" + searchString.split(/\s+/g).filter(function(word) {
			return !!word
		}).map($tw.utils.escapeRegExp).join("\\s+") + ")";
	} else {
		// Normal search
		regExpString = "(" + $tw.utils.escapeRegExp(searchString) + ")";
	}
	// Compile the regular expression
	var regExp;
	try {
		regExp = RegExp(regExpString,flags);
	} catch(e) {
	}
	if(!regExp) {
		return [];
	}
	// Find each match
	var results = [],
		match;
	do {
		match = regExp.exec(this.string);
		if(match) {
			var metadataStart = this.locateMetadata(match.index),
				metadataEnd = this.locateMetadata(match.index + match[0].length);
			if(metadataStart && metadataEnd) {
				results.push({
					startPos: match.index,
					startNode: metadataStart.domNode,
					startOffset: match.index - metadataStart.start,
					endPos: match.index + match[0].length,
					endNode: metadataEnd.domNode,
					endOffset: match.index + match[0].length - metadataEnd.start
				});
			}
		}
	} while(match);
	return results;
};

/*
Given a start container and offset and a search string, return a prefix and suffix to disambiguate the text
*/
exports.TextMap.prototype.extractContext = function(startContainer,startOffset,text) {
	var startMetadata = this.metadata.find(function(metadata) {
			return metadata.domNode === startContainer
		});
	if(!startMetadata) {
		return null;
	}
	var startPos = startMetadata.start + startOffset;
	return {
		prefix: this.string.slice(Math.max(startPos - PREFIX_SUFFIX_LENGTH, 0), startPos),
		suffix: this.string.slice(startPos + text.length, Math.min(startPos + text.length + PREFIX_SUFFIX_LENGTH, this.string.length))
	};
};

})();
