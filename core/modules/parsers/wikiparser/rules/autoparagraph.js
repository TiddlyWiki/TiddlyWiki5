/*\
title: $:/core/modules/parsers/wikiparser/rules/autoparagraph.js
type: application/javascript
module-type: wikirule

Wiki pragma rule for whether p tags should be inserted for text blocks

```
\autoparagraph yes
\autoparagraph no
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "autoparagraph";
exports.types = {pragma: true};

/*
Instantiate parse rule
*/
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /^\\autoparagraph[^\S\n]/mg;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Move past the pragma invocation
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse whitespace delimited tokens terminated by a line break
	var reMatch = /[^\S\n]*(\S+)|(\r?\n)/mg,
		tokens = [];
	reMatch.lastIndex = this.parser.pos;
	var match = reMatch.exec(this.parser.source);
	while(match && match.index === this.parser.pos) {
		this.parser.pos = reMatch.lastIndex;
		// Exit if we've got the line break
		if(match[2]) {
			break;
		}
		// Process the token
		if(match[1]) {
			tokens.push(match[1]);
		}
		// Match the next token
		match = reMatch.exec(this.parser.source);
	}
	if(tokens.length > 0) {
		// Set it for the current file and leave it on if malformed
		if(tokens[0] === "no") {
			this.parser.autoParagraph = false;
		} else {
			this.parser.autoParagraph = true;
		}
		// And set it for everything transcluded or otherwise parsed
		return [{
			type: "set",
			attributes: {
				name: {type: "string", value: "tv-auto-paragraph"},
				value: {type: "string", value: this.parser.autoParagraph ? "yes" : "no"}
			},
			children: []
		}];
	} else {
		return [];
	}
	
	
};

})();
