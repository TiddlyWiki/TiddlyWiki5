/*\
title: $:/core/modules/parsers/wikiparser/rules/dir.js
type: application/javascript
module-type: wikirule

Wiki pragma rule for specifying text direction

```
\dir rtl
\dir ltr
\dir auto
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "dir";
exports.types = {pragma: true};

/*
Instantiate parse rule
*/
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /^\\dir[^\S\n]*(\S+)\r?\n/mg;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	var self = this;
	// Move past the pragma invocation
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse tree nodes to return
	return [{
		type: "element",
		tag: this.parser.parseAsInline ? "span" : "div",
		attributes: {
			dir: {type: "string", value: this.match[1]}
		},
		children: []
	}];
};

})();
