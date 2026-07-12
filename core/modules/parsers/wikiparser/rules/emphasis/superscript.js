/*\
title: $:/core/modules/parsers/wikiparser/rules/emphasis/superscript.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for emphasis - superscript. For example:

```
	This is ^^superscript^^ text
```

This wikiparser can be modified using the rules eg:

```
\rules except superscript 
\rules only superscript 
```

\*/

"use strict";

// A run that ends here met the end of its block rather than its closing delimiter
var BLOCK_BOUNDARY = /^\r?\n/;

exports.name = "superscript";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\^\^/mg;
};

exports.parse = function() {
	var delimiterStart = this.parser.pos;
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;


	// Parse the run including the terminator
	var bodyStart = this.parser.pos;
	var ex = this.parser.parseInlineRunTerminatedExtended(/\^\^|\r?\n\r?\n/mg,{eatTerminator: true});
	if(!ex.match || BLOCK_BOUNDARY.test(ex.match[0])) {
		// The run reached the end of the source without a closer, so the delimiter rewinds to literal text and parsing resumes after it
		this.parser.pos = bodyStart;
		this.parser.addDiagnostic({
			from: delimiterStart,
			to: bodyStart,
			severity: "warning",
			code: "unterminated-superscript",
			message: "Unmatched superscript delimiter rendered as literal text"
		});
		return [{type: "text", text: "^^", start: delimiterStart, end: bodyStart, isRecovered: true}];
	}
	var tree = ex.tree;

	// Return the classed span
	return [{
		type: "element",
		tag: "sup",
		children: tree
	}];
};
