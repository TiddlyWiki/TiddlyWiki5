/*\
title: $:/core/modules/parsers/wikiparser/rules/inline/wikilink.js
type: application/javascript
module-type: wiki-inline-rule

Wiki text inline rule for wiki links. For example:

{{{
AWikiLink
AnotherLink
~SuppressedLink
}}}

Precede a camel case word with `~` to prevent it from being recognised as a link.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "wikilink";

var textPrimitives = {
	upperLetter: "[A-Z\u00c0-\u00de\u0150\u0170]",
	lowerLetter: "[a-z0-9_\\-\u00df-\u00ff\u0151\u0171]",
	anyLetter:   "[A-Za-z0-9_\\-\u00c0-\u00de\u00df-\u00ff\u0150\u0170\u0151\u0171]",
	anyLetterStrict: "[A-Za-z0-9\u00c0-\u00de\u00df-\u00ff\u0150\u0170\u0151\u0171]"
};

textPrimitives.unWikiLink = "~";
textPrimitives.wikiLink = textPrimitives.upperLetter + "+" +
	textPrimitives.lowerLetter + "+" +
	textPrimitives.upperLetter +
	textPrimitives.anyLetter + "*";

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = new RegExp(textPrimitives.unWikiLink + "?" + textPrimitives.wikiLink,"mg");
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Get the details of the match
	var linkText = this.match[0];
	// Move past the macro call
	this.parser.pos = this.matchRegExp.lastIndex;
	// If the link starts with the unwikilink character then just output it as plain text
	if(linkText.substr(0,1) === textPrimitives.unWikiLink) {
		return [{type: "text", text: linkText.substr(1)}];
	}
	// If the link has been preceded with a letter then don't treat it as a link
	if(this.match.index > 0) {
		var preRegExp = new RegExp(textPrimitives.anyLetterStrict,"mg");
		preRegExp.lastIndex = this.match.index-1;
		var preMatch = preRegExp.exec(this.parser.source);
		if(preMatch && preMatch.index === this.match.index-1) {
			return [{type: "text", text: linkText}];
		}
	}
	return [{
		type: "widget",
		tag: "link",
		attributes: {
			to: {type: "string", value: linkText}
		},
		children: [{
			type: "text",
			text: linkText
		}]
	}];
};

})();
