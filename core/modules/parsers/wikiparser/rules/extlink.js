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
	// Extend the match to include balanced closing parentheses
	var url = this.match[0];
	while(this.parser.pos < this.parser.sourceLength && this.parser.source.charAt(this.parser.pos) === ")") {
		var opens = (url.match(/\(/g) || []).length;
		var closes = (url.match(/\)/g) || []).length;
		if(opens > closes) {
			url += ")";
			this.parser.pos++;
		} else {
			break;
		}
	}
	// Create the link unless it is suppressed
	if(url.substr(0,1) === "~") {
		return [{type: "text", text: url.substr(1), start: start, end: this.parser.pos}];
	} else {
		return [{
			type: "element",
			tag: "a",
			attributes: {
				href: {type: "string", value: url},
				"class": {type: "string", value: "tc-tiddlylink-external"},
				target: {type: "string", value: "_blank"},
				rel: {type: "string", value: "noopener noreferrer"}
			},
			children: [{
				type: "text", text: url, start: start, end: this.parser.pos
			}]
		}];
	}
};
