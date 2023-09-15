/*\
title: $:/core/modules/parsers/wikiparser/rules/prettylink.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for pretty links. For example:

```
[[Introduction]]

[[Link description|TiddlerTitle]]
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "prettylink";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match `[[Title^blockId|Alias]]`, the `^blockId` and `|Alias` are optional.
	this.matchRegExp = /\[\[(.*?)(?:\^([^|\s^]+))?(?:\|(.*?))?\]\]/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Process the link
	var text = this.match[1],
		blockId = this.match[2] || "",
		link = this.match[3] || text;
	if($tw.utils.isLinkExternal(link)) {
		// add back the part after `^` to the ext link, if it happen to has one.
		if(blockId) {
			link = link + "^" + blockId;
		}
		return [{
			type: "element",
			tag: "a",
			attributes: {
				href: {type: "string", value: link},
				"class": {type: "string", value: "tc-tiddlylink-external"},
				target: {type: "string", value: "_blank"},
				rel: {type: "string", value: "noopener noreferrer"}
			},
			children: [{
				type: "text", text: text
			}]
		}];
	} else {
		return [{
			type: "link",
			attributes: {
				to: {type: "string", value: link},
				id: {type: "string", value: blockId},
			},
			children: [{
				type: "text", text: text
			}]
		}];
	}
};

})();
