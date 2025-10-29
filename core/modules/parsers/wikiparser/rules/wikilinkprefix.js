/*\
title: $:/core/modules/parsers/wikiparser/rules/wikilinkprefix.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for suppressed wiki links. For example:

```
~SuppressedLink
```

\*/

"use strict";

exports.name = "wikilinkprefix";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = new RegExp($tw.config.textPrimitives.unWikiLink + $tw.config.textPrimitives.wikiLink,"mg");
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Get the details of the match
	var linkText = this.match[0];
	// Move past the wikilink
	this.parser.pos = this.matchRegExp.lastIndex;
	// Return the link without unwikilink character as plain text
	return [{type: "text", text: linkText.substr(1)}];
};
