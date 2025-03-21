/*\
title: $:/core/modules/parsers/wikiparser/rules/extlink.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for external links. For example:

```
An external link: https://www.tiddlywiki.com/

A suppressed external link: ~http://www.tiddlyspace.com/
```

External links can be suppressed by preceding them with `~`.

\*/

"use strict";

exports.name = "extlink";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /~?(?:file|http|https|mailto|ftp|irc|news|data|skype):[^\s<>{}\[\]`|"\\^]+(?:\/|\b)/mg;
};

exports.parse = function() {
	// Move past the match
    var start = this.parser.pos;
	this.parser.pos = this.matchRegExp.lastIndex;
	// Create the link unless it is suppressed
	if(this.match[0].substr(0,1) === "~") {
		return [{type: "text", text: this.match[0].substr(1)}];
	} else {
		return [{
			type: "element",
			tag: "a",
			attributes: {
				href: {type: "string", value: this.match[0]},
				"class": {type: "string", value: "tc-tiddlylink-external"},
				target: {type: "string", value: "_blank"},
				rel: {type: "string", value: "noopener noreferrer"}
			},
			children: [{
				type: "text", text: this.match[0], start: start, end: this.parser.pos
			}]
		}];
	}
};
