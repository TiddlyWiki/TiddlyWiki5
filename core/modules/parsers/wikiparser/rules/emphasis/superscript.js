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
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "superscript";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\^\^/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;

	// Parse the run including the terminator
	var tree = this.parser.parseInlineRun(/\^\^/mg,{eatTerminator: true});

	// Return the classed span
	return [{
		type: "element",
		tag: "sup",
		children: tree
	}];
};

})();