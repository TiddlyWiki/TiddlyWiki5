/*\
title: $:/core/modules/parsers/wikiparser/rules/commentpragma.js
type: application/javascript
module-type: wikirule

This rule has been "cloned" from rule: $:/core/modules/parsers/wikiparser/rules/commentblock.js

Wiki text block rule for HTML comments in the tiddler pragma area. 
Only BLOCK rule is needed, since "inline" is the same as wikitext inline

For example:

```
<!-- This is a comment in the "pragma" area -->
\define xx()
some text
\end

<<xx>>
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "commentpragma";
exports.types = {pragma: true};

exports.init = function(parser) {
	this.parser = parser;
	this.matchRegExp = /<!--/mg;
	this.endMatchRegExp = /-->/mg;
};

exports.findNextMatch = function(startPos) {
	this.matchRegExp.lastIndex = startPos;
	this.match = this.matchRegExp.exec(this.parser.source);
	if(this.match) {
		this.endMatchRegExp.lastIndex = this.match.index + this.match[0].length;
		this.endMatch = this.endMatchRegExp.exec(this.parser.source);
		if(this.endMatch) {
			return this.match.index;
		}
	}
	return undefined;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.endMatchRegExp.lastIndex;
	// Don't return any elements
	return [];
};

})();
