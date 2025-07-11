/*\
title: $:/plugins/tiddlywiki/dynannotate/textmap.js
type: application/javascript
module-type: library

Structure for modelling mapping between a string and its representation in the DOM

\*/

"use strict";

const PREFIX_SUFFIX_LENGTH = 50;

/*
Build a map of the text content of a DOM node and its descendants:

string: concatenation of the text content of child nodes
metadata: array of {start,end,domNode} where start and end identify position in the string
*/
exports.TextMap = function(domNode) {
	const self = this;
	const stringChunks = [];
	let p = 0;
	this.metadata = [];
	const processNode = function(domNode) {
		// Check for text nodes
		if(domNode.nodeType === 3) {
			const text = domNode.textContent;
			stringChunks.push(text);
			self.metadata.push({
				start: p,
				end: p + text.length,
				domNode
			});
			p += text.length;
		} else {
			// Otherwise look within the child nodes
			if(domNode.childNodes) {
				for(let t = 0;t < domNode.childNodes.length;t++) {
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
	return this.metadata.find((metadata) => {
		return position >= metadata.start && position < metadata.end;
	});
};

/*
Search for the first occurrence of a target string within the textmap of a DOM node

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
	let startPos = this.string.indexOf(targetPrefix + targetString + targetSuffix);
	if(startPos !== -1) {
		startPos += targetPrefix.length;
		const startMetadata = this.locateMetadata(startPos);
		const endMetadata = this.locateMetadata(startPos + targetString.length - 1);
		if(startMetadata && endMetadata) {
			return {
				startNode: startMetadata.domNode,
				startOffset: startPos - startMetadata.start,
				endNode: endMetadata.domNode,
				endOffset: (startPos + targetString.length) - endMetadata.start
			};
		}
	}
	return null;
};

/*
Search for all occurrences of a string within the textmap of a DOM node

Options include:
	mode: "normal", "literal", "regexp", "whitespace", "some" or "words"
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
	let regExpString;
	const flags = options.caseSensitive ? "g" : "gi";
	if(options.mode === "regexp") {
		regExpString = `(${searchString})`;
	} else if(options.mode === "whitespace") {
		// Normalise whitespace
		regExpString = `(${searchString.split(/\s+/g).filter((word) => {
			return !!word;
		}).map($tw.utils.escapeRegExp).join(String.raw`\s+`)})`;
	} else if(options.mode === "words" || options.mode === "some") {
		// Match any word separated by whitespace
		regExpString = `(${searchString.split(/\s+/g).filter((word) => {
			return !!word;
		}).map($tw.utils.escapeRegExp).join("|")})`;
	} else {
		// Normal search
		regExpString = `(${$tw.utils.escapeRegExp(searchString)})`;
	}
	// Compile the regular expression
	let regExp;
	try {
		regExp = RegExp(regExpString,flags);
	} catch(e) {}
	if(!regExp) {
		return [];
	}
	// Find each match
	const results = [];
	let match;
	do {
		match = regExp.exec(this.string);
		if(match) {
			const metadataStart = this.locateMetadata(match.index);
			const metadataEnd = this.locateMetadata(match.index + match[0].length);
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
	const startMetadata = this.metadata.find((metadata) => {
		return metadata.domNode === startContainer;
	});
	if(!startMetadata) {
		return null;
	}
	const startPos = startMetadata.start + startOffset;
	return {
		prefix: this.string.slice(Math.max(startPos - PREFIX_SUFFIX_LENGTH,0),startPos),
		suffix: this.string.slice(startPos + text.length,Math.min(startPos + text.length + PREFIX_SUFFIX_LENGTH,this.string.length))
	};
};
