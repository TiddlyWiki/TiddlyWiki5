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

var voidElements = "area,base,br,col,command,embed,hr,img,input,keygen,link,meta,param,source,track,wbr".split(",");

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	if(this.is.block) {
		this.matchRegExp = /<(\$)?([A-Za-z]+)(\s*[^>]*?)(\/)?>(\r?\n)/mg;
	} else {
		this.matchRegExp = /<(\$)?([A-Za-z]+)(\s*[^>]*?)(\/)?>(\r?\n)?/mg;
	}
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Get all the details of the match in case this parser is called recursively
	var isWidget = !!this.match[1],
		tagName = this.match[2],
		attributeString = this.match[3],
		isSelfClosing = !!this.match[4],
		hasLineBreak = !!this.match[5];
	// Move past the tag name and parameters
	this.parser.pos = this.matchRegExp.lastIndex;
	var reAttr = /\s*([A-Za-z\-_]+)(?:\s*=\s*(?:("[^"]*")|('[^']*')|(\{\{[^\}]*\}\})|([^"'\s]+)))?/mg;
	// Process the attributes
	var attrMatch = reAttr.exec(attributeString),
		attributes = {};
	while(attrMatch) {
		var name = attrMatch[1],
			value;
		if(attrMatch[2]) { // Double quoted
			value = {type: "string", value: attrMatch[2].substring(1,attrMatch[2].length-1)};
		} else if(attrMatch[3]) { // Single quoted
			value = {type: "string", value: attrMatch[3].substring(1,attrMatch[3].length-1)};
		} else if(attrMatch[4]) { // Double curly brace quoted
			value = {type: "indirect", textReference: attrMatch[4].substr(2,attrMatch[4].length-4)};
		} else if(attrMatch[5]) { // Unquoted
			value = {type: "string", value: attrMatch[5]};
		} else { // Valueless
			value = {type: "string", value: "true"}; // TODO: We should have a way of indicating we want an attribute without a value
		}
		attributes[name] = value;
		attrMatch = reAttr.exec(attributeString);
	}
	// Process the end tag
	if(!isSelfClosing && (isWidget || voidElements.indexOf(tagName) === -1)) {
		var reEndString = "(</" + (isWidget ? "\\$" : "") + tagName + ">)",
			reEnd = new RegExp(reEndString,"mg"),
			content;
		if(hasLineBreak) {
			content = this.parser.parseBlocks(reEndString);
		} else {
			content = this.parser.parseInlineRun(reEnd);
		}
		reEnd.lastIndex = this.parser.pos;
		var endMatch = reEnd.exec(this.parser.source);
		if(endMatch && endMatch.index === this.parser.pos) {
			this.parser.pos = endMatch.index + endMatch[0].length;
		}
	} else {
		content = [];
	}
	var element = {
		type: isWidget ? "widget" : "element",
		tag: tagName,
		isBlock: this.is.block || hasLineBreak,
		attributes: attributes,
		children: content
	};
	return [element];
};

})();
