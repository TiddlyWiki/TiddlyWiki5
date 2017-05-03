/*\
title: $:/core/modules/parsers/wikiparser/rules/unwikilink.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for disabled wiki links. For example:

```
AWikiLink
AnotherLink
~SuppressedLink
```

It also prevents the tilde in `~SuppressedLink` to be shown, if wikilinks are globally switched off. Needed for compatibility reasons.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "unwikilink";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match. ... Be aware the ~ sign is not optional for this rule.
	this.matchRegExp = new RegExp($tw.config.textPrimitives.unWikiLink + $tw.config.textPrimitives.wikiLink,"mg");
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Get the details of the match
	var linkText = this.match[0];
	// Move past the macro call
	this.parser.pos = this.matchRegExp.lastIndex;
	// If the link starts with the unwikilink character then just output it as plain text
	return [{type: "text", text: linkText.substr(1)}];
};

})();
