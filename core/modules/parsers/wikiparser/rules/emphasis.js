/*\
title: $:/core/modules/parsers/wikiparser/rules/emphasis.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for emphasis. For example:

```
	This is ''bold'' text

	This is //italic// text

	This is __underlined__ text

	This is ^^superscript^^ text

	This is ,,subscript,, text

	This is ~~strikethrough~~ text
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "emphasis";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /''|\/\/|__|\^\^|,,|~~/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Figure out which element and closing regexp to use
	var tag,reEnd;
	switch(this.match[0]) {
		case "''": // Bold
			tag = "strong";
			reEnd = /''/mg;
			break;
		case "//": // Italics
			tag = "em";
			reEnd = /\/\//mg;
			break;
		case "__": // Underline
			tag = "u";
			reEnd = /__/mg;
			break;
		case "^^": // Superscript
			tag = "sup";
			reEnd = /\^\^/mg;
			break;
		case ",,": // Subscript
			tag = "sub";
			reEnd = /,,/mg;
			break;
		case "~~": // Strikethrough
			tag = "strike";
			reEnd = /~~/mg;
			break;
	}
	// Parse the run including the terminator
	var tree = this.parser.parseInlineRun(reEnd,{eatTerminator: true});
	// Return the classed span
	return [{
		type: "element",
		tag: tag,
		children: tree
	}];
};

})();
