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

"use strict";

exports.name = "prettylink";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match `[[Alias|Title^anchor]]`, the `Alias|` and `^anchor` are optional.
	// Note: no inner `?` after the capture groups — `[[Title|]]` (empty alias) or `[[Title^]]`
	// (empty anchor) are not valid syntax and should not match.
	this.matchRegExp = /\[\[(.*?)(?:\|(.*?))?(?:\^([^|\s^]+))?\]\]/mg;
};

exports.parse = function() {
	// Move past the match
	var start = this.parser.pos + 2;
	this.parser.pos = this.matchRegExp.lastIndex;
	// Process the link
	var text = this.match[1],
		link = this.match[2] || text,
		anchor = this.match[3] || "",
		textEndPos = this.parser.source.indexOf("|", start);
	if(textEndPos < 0 || textEndPos > this.matchRegExp.lastIndex) {
		textEndPos = this.matchRegExp.lastIndex - 2;
	}
	var linkStart = this.match[2] ? (start + this.match[1].length + 1) : start;
	var linkEnd = linkStart + link.length;
	if($tw.utils.isLinkExternal(link)) {
		// add back the part after `^` to the ext link, if it happens to have one. Here it is not an anchor, but a part of the external URL.
		if(anchor) {
			link = link + "^" + anchor;
		}
		return [{
			type: "element",
			tag: "a",
			attributes: {
				href: {type: "string", value: link, start: linkStart, end: linkEnd},
				"class": {type: "string", value: "tc-tiddlylink-external"},
				target: {type: "string", value: "_blank"},
				rel: {type: "string", value: "noopener noreferrer"}
			},
			children: [{
				type: "text", text: text, start: start, end: textEndPos
			}]
		}];
	} else {
		var anchorStart = anchor ? (linkEnd + 1) : linkEnd;
		var anchorEnd = anchorStart + anchor.length;
		return [{
			type: "link",
			attributes: {
				to: {type: "string", value: link, start: linkStart, end: linkEnd},
				anchor: {type: "string", value: anchor, start: anchorStart, end: anchorEnd},
			},
			children: [{
				type: "text", text: text, start: start, end: textEndPos
			}]
		}];
	}
};
