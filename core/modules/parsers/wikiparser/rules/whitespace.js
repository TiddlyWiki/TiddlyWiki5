/*\
title: $:/core/modules/parsers/wikiparser/rules/whitespace.js
type: application/javascript
module-type: wikirule

Wiki pragma rule for whitespace specifications

```
\whitespace trim
\whitespace notrim
```

\*/

"use strict";

exports.name = "whitespace";
exports.types = {pragma: true};

/*
Instantiate parse rule
*/
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\\whitespace[^\S\n]/mg;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	var self = this;
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
	// Process the tokens
	$tw.utils.each(tokens,function(token) {
		switch(token) {
			case "trim":
				self.parser.configTrimWhiteSpace = true;
				break;
			case "notrim":
				self.parser.configTrimWhiteSpace = false;
				break;
		}
	});
	// No parse tree nodes to return
	return [];
};
