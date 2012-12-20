/*\
title: $:/core/modules/parsers/wikiparser/rules/block/codeblock.js
type: application/javascript
module-type: wiki-block-rule

Wiki text rule for code blocks. For example:

{{{
	{{{
	This text will not be //wikified//
	}}}
}}}

Note that the opening curly braces and the closing curly braces must each be on a line of their own, and not be preceded or followed by white space.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "codeblock";

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\{\{\{\r?\n/mg;
};

exports.parse = function(match,isBlock) {
	var reEnd = /(\r?\n\}\}\}$)/mg;
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Look for the end of the block
	reEnd.lastIndex = this.parser.pos;
	var match = reEnd.exec(this.parser.source),
		text;
	// Process the block
	if(match) {
		text = this.parser.source.substring(this.parser.pos,match.index);
		this.parser.pos = match.index + match[0].length;
	} else {
		text = this.parser.source.substr(this.parser.pos);
		this.parser.pos = this.parser.sourceLength;
	}
	// Return the pre element
	return [{
		type: "element",
		tag: "pre",
		children: [{
			type: "text",
			text: text
		}]
	}];
};

})();
