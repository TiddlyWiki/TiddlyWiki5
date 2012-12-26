/*\
title: $:/core/modules/parsers/wikiparser/rules/rules.js
type: application/javascript
module-type: wikirule

Wiki pragma rule for rules specifications

```
\rules except ruleone ruletwo rulethree
\rules only ruleone ruletwo rulethree
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "rules";
exports.types = {pragma: true};

/*
Instantiate parse rule
*/
exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /^\\rules[^\S\n]/mg;
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
	// Process the tokens
	if(tokens.length > 0) {
		this.parser.amendRules(tokens[0],tokens.slice(1));
	}
};

})();
