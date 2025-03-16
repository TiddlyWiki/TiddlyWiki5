/*\
title: $:/core/modules/parsers/wikiparser/rules/emphasis/bold.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for emphasis - bold. For example:

```
	This is ''bold'' text
```

This wikiparser can be modified using the rules eg:

```
\rules except bold 
\rules only bold 
```

\*/

"use strict";

exports.name = "bold";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /''/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;

	// Parse the run including the terminator
	var tree = this.parser.parseInlineRun(/''/mg,{eatTerminator: true});

	// Return the classed span
	return [{
		type: "element",
		tag: "strong",
		children: tree
	}];
};
