/*\
title: $:/core/modules/parsers/wikiparser/rules/hardlinebreaks.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for marking areas with hard line breaks. For example:

```
"""
This is some text
That is set like
It is a Poem
When it is
Clearly
Not
"""
```

\*/

"use strict";

exports.name = "hardlinebreaks";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /"""(?:\r?\n)?/mg;
};

exports.parse = function() {
	var start = this.match.index;
	var reEnd = /(""")|(\r?\n)/mg,
		tree = [],
		match;
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	do {
		// Parse the run up to the terminator
		tree.push.apply(tree,this.parser.parseInlineRun(reEnd,{eatTerminator: false}));
		// Redo the terminator match
		reEnd.lastIndex = this.parser.pos;
		match = reEnd.exec(this.parser.source);
		if(match) {
			var brStart = this.parser.pos;
			this.parser.pos = reEnd.lastIndex;
			// Add a line break if the terminator was a line break
			if(match[2]) {
				tree.push({type: "element", tag: "br", rule: "hardlinebreaks", start: brStart, end: this.parser.pos});
			}
		}
	} while(match && !match[1]);
	// Return a void wrapper so the inner nodes keep their own rule names,
	// e.g. bold inside the region stays rule "bold"
	return [{
		type: "void",
		children: tree,
		start: start,
		end: this.parser.pos
	}];
};
