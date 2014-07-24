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
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "underscore";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /__/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;

    // Parse the run including the terminator
	var tree = this.parser.parseInlineRun(/__/mg,{eatTerminator: true});

    // Return the classed span
	return [{
		type: "element",
		tag: "u",
		children: tree
	}];
};

})();