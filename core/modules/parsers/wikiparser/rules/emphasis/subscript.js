/*\
title: $:/core/modules/parsers/wikiparser/rules/emphasis/subscript.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for emphasis - subscript. For example:

```
	This is ,,subscript,, text
```

This wikiparser can be modified using the rules eg:

```
\rules except subscript 
\rules only subscript 
```

\*/

"use strict";

var BLOCK_BOUNDARY = /^\r?\n/;

exports.name = "subscript";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /,,/mg;
};

exports.parse = function() {
	var delimiterStart = this.parser.pos;
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;

	// Parse the run including the terminator
	var bodyStart = this.parser.pos;
	var ex = this.parser.parseInlineRunTerminatedExtended(/,,|\r?\n\r?\n/mg,{eatTerminator: true});
	if(!ex.match || BLOCK_BOUNDARY.test(ex.match[0])) {
		this.parser.pos = bodyStart;
		this.parser.addDiagnostic({
			from: delimiterStart,
			to: bodyStart,
			severity: "warning",
			code: "unterminated-subscript",
			message: "Unmatched subscript delimiter rendered as literal text"
		});
		return [{type: "text", text: ",,", start: delimiterStart, end: bodyStart, isRecovered: true}];
	}
	var tree = ex.tree;

	// Return the classed span
	return [{
		type: "element",
		tag: "sub",
		children: tree
	}];
};
