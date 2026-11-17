/*\
title: $:/core/modules/parsers/wikiparser/rules/codeblock.js
type: application/javascript
module-type: wikirule

Wiki text rule for code blocks. For example:

```
	```
	This text will not be //wikified//
	```
```

\*/

"use strict";

exports.name = "codeblock";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match and get language if defined
	this.matchRegExp = /(`{3,})([\w-]*)\r?\n/mg;
};

exports.parse = function() {
	var fenceLength = this.match[1].length,
		lineStart = this.parser.source.lastIndexOf("\n",this.match.index - 1) + 1,
		openingIndentation = this.parser.source.substring(lineStart,this.match.index).match(/[ \t]*$/)[0].length,
		reEnd = new RegExp("(^|\\r?\\n)[ \\t]{0," + openingIndentation + "}`{" + fenceLength + ",}(?=\\r?\\n|$)","mg"),
		languageStart = this.parser.pos + fenceLength,
		languageEnd = languageStart + this.match[2].length;
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;

	// Look for the end of the block
	reEnd.lastIndex = this.parser.pos;
	var match = reEnd.exec(this.parser.source),
		text,
		codeStart = this.parser.pos;
	// Process the block
	if(match) {
		text = this.parser.source.substring(this.parser.pos,match.index);
		this.parser.pos = match.index + match[0].length;
	} else {
		text = this.parser.source.substr(this.parser.pos);
		this.parser.pos = this.parser.sourceLength;
	}
	// Return the $codeblock widget
	return [{
		type: "codeblock",
		attributes: {
			code: {type: "string", value: text, start: codeStart, end: this.parser.pos},
			language: {type: "string", value: this.match[2], start: languageStart, end: languageEnd}
		}
	}];
};
