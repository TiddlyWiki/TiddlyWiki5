/*\
title: $:/plugins/tiddlywiki/hard-line-breaks/ssnl.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for a hard line break made by two spaces, or two spaces and a backslash, before the line end. For example:

```
There are two spaces at the end of this line
So this is the second line
```

\*/

"use strict";

exports.name = "ssnl";
exports.types = {inline: true};

/*
Instantiate parse rule
*/
exports.init = function(parser) {
	this.parser = parser;
	// No break before a blank line or at the end of the text, so paragraphs stay apart
	this.matchRegExp = / {2}\\?\r?\n(?![^\S\n]*(?:\r?\n|$))/g;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Move past the match, including the line end, so the run continues on the next line
	this.parser.pos = this.matchRegExp.lastIndex;
	return [{
		type: "element",
		tag: "br",
		start: this.match.index,
		end: this.parser.pos,
		// The form written, two spaces with or without the backslash, so a serializer can reproduce it
		marker: this.match[0].replace(/\r?\n$/,"")
	}];
};
