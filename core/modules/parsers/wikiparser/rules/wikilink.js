/*\
title: $:/core/modules/parsers/wikiparser/rules/wikilink.js
type: application/javascript
module-type: wikirule
\*/

"use strict";

exports.name = "wikilink";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = new RegExp($tw.config.textPrimitives.unWikiLink + "?" + $tw.config.textPrimitives.wikiLink,"mg");
};

exports.parse = function() {
	// Get the details of the match
	var linkText = this.match[0];
	// Move past the macro call
	var start = this.parser.pos;
	this.parser.pos = this.matchRegExp.lastIndex;
	// If the link starts with the unwikilink character then just output it as plain text
	if(linkText.substr(0,1) === $tw.config.textPrimitives.unWikiLink) {
		return [{type: "text", text: linkText.substr(1)}];
	}

	if(this.match.index > 0) {
		var preRegExp = new RegExp($tw.config.textPrimitives.blockPrefixLetters,"mg");
		preRegExp.lastIndex = this.match.index-1;
		var preMatch = preRegExp.exec(this.parser.source);
		if(preMatch && preMatch.index === this.match.index-1) {
			return [{type: "text", text: linkText}];
		}
	}
	return [{
		type: "link",
		attributes: {
			to: {type: "string", value: linkText}
		},
		children: [{
			type: "text",
			text: linkText,
			start: start,
			end: this.parser.pos
		}]
	}];
};
