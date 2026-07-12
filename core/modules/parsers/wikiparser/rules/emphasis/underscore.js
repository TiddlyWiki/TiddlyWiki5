/*\
title: $:/core/modules/parsers/wikiparser/rules/emphasis/underscore.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for emphasis - underscore. For example:

```
	This is __underscore__ text
```

This wikiparser can be modified using the rules eg:

```
\rules except underscore 
\rules only underscore
```

\*/

"use strict";

var BLOCK_BOUNDARY = /^\r?\n/;

exports.name = "underscore";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /__/mg;
};

exports.parse = function() {
	var delimiterStart = this.parser.pos;
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;

	// Parse the run including the terminator
	var bodyStart = this.parser.pos;
	var ex = this.parser.parseInlineRunTerminatedExtended(/__|\r?\n\r?\n/mg,{eatTerminator: true});
	if(!ex.match || BLOCK_BOUNDARY.test(ex.match[0])) {
		this.parser.pos = bodyStart;
		this.parser.addDiagnostic({
			from: delimiterStart,
			to: bodyStart,
			severity: "warning",
			code: "unterminated-underscore",
			message: "Unmatched underscore delimiter rendered as literal text"
		});
		return [{type: "text", text: "__", start: delimiterStart, end: bodyStart, isRecovered: true}];
	}
	var tree = ex.tree;

	// Return the classed span
	return [{
		type: "element",
		tag: "u",
		children: tree
	}];
};
