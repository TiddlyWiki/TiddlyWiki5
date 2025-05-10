/*\
title: $:/core/modules/parsers/wikiparser/rules/commentinline.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for HTML comments. For example:

```
<!-- This is a comment -->
```

Note that the syntax for comments is simplified to an opening "<!--" sequence and a closing "-->" sequence -- HTML itself implements a more complex format (see http://ostermiller.org/findhtmlcomment.html)

\*/

"use strict";

exports.name = "commentinline";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	this.matchRegExp = /<!--/mg;
	this.endMatchRegExp = /-->/mg;
};

exports.findNextMatch = function(startPos) {
	this.matchRegExp.lastIndex = startPos;
	this.match = this.matchRegExp.exec(this.parser.source);
	if(this.match) {
		this.endMatchRegExp.lastIndex = this.match.index + this.match[0].length;
		this.endMatch = this.endMatchRegExp.exec(this.parser.source);
		if(this.endMatch) {
			return this.match.index;
		}
	}
	return undefined;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.endMatchRegExp.lastIndex;
	// Return a node representing the inline comment
	var commentStart = this.match.index;
	var commentEnd = this.endMatch.index + this.endMatch[0].length;
	return [{
			type: "void",
			text: this.parser.source.slice(commentStart, commentEnd),
			start: commentStart,
			end: commentEnd
	}];
};
