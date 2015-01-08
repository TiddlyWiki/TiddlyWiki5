/*\
title: $:/core/modules/parsers/wikiparser/rules/extlink.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for external links and system tiddler links.
Can be suppressed preceding them with `~`.

```
; system tiddler
: $:/config

; external link
: http://www.tiddlywiki.com/

; suppressed external link
: ~http://www.tiddlyspace.com/
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "extlink";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /~?(?:\$|file|http|https|mailto|ftp|irc|news|data|skype):[^\s<>{}\[\]`|'"\\^~]+(?:\/|\b)/mg;
};

exports.parse = function() {
	var match = this.match[0];
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Create the link unless it is suppressed
	if(match.substr(0,1) === "~") {
		return [{type: "text", text: match.substr(1)}];
	} else if(match.substr(0,1) === "$") {
		return [{
			type: "link",
			attributes: {
				to: {type: "string", value: match}
			},
			children: [{
				type: "text",
				text: match
			}]
		}];
	} else {
		return [{
			type: "element",
			tag: "a",
			attributes: {
				href: {type: "string", value: match},
				"class": {type: "string", value: "tc-tiddlylink-external"},
				target: {type: "string", value: "_blank"}
			},
			children: [{
				type: "text", text: match
			}]
		}];
	}
};

})();