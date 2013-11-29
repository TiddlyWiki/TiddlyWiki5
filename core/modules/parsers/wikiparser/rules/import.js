/*\
title: $:/core/modules/parsers/wikiparser/rules/import.js
type: application/javascript
module-type: wikirule

Wiki pragma rule for macro import

```
\import Tiddlername
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "import";
exports.types = {pragma: true};

/*
Instantiate parse rule
*/
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /^\\import\s+([^(\s]+)\s*(\r?\n)?/mg;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Move past the macro name and parameters
	this.parser.pos = this.matchRegExp.lastIndex;
	return [{
		type: "import",
		name: this.match[1]
	}];
};

})();
