/*\
title: $:/core/modules/parsers/wikiparser/rules/emphasis/italic.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for emphasis - italic. For example:

```
	This is //italic// text
```

This wikiparser can be modified using the rules eg:

```
\rules except italic
\rules only italic
```

\*/

"use strict";

exports.name = "italic";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\/\//mg;
};

exports.parse = function() {
	var delimiterStart = this.parser.pos;
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;


	// Parse the run including the terminator
	var bodyStart = this.parser.pos;
	var ex = this.parser.parseInlineRunTerminatedExtended(/\/\//mg,{eatTerminator: true});
	if(!ex.match) {
		// The run reached the end of the source without a closer, so the delimiter rewinds to literal text and parsing resumes after it
		this.parser.pos = bodyStart;
		this.parser.addDiagnostic({
			from: delimiterStart,
			to: bodyStart,
			severity: "warning",
			code: "unterminated-italic",
			message: "Unmatched italic delimiter rendered as literal text"
		});
		return [{type: "text", text: "//"}];
	}
	var tree = ex.tree;

	// Return the classed span
	return [{
		type: "element",
		tag: "em",
		children: tree
	}];
};
