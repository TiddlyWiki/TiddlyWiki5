/*\
title: $:/core/modules/parsers/wikiparser/rules/typedblock.js
type: application/javascript
module-type: wikirule

Wiki text rule for typed blocks. For example:

```
$$$.js
This will be rendered as JavaScript
$$$

$$$.svg
<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100">
  <circle cx="100" cy="50" r="40" stroke="black" stroke-width="2" fill="red" />
</svg>
$$$

$$$text/vnd.tiddlywiki>text/html
This will be rendered as an //HTML representation// of WikiText
$$$
```

\*/

"use strict";

const widget = require("$:/core/modules/widgets/widget.js");

exports.name = "typedblock";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\$\$\$([^ >\r\n]*)(?: *> *([^ \r\n]+))?\r?\n/mg;
};

exports.parse = function() {
	const reEnd = /\r?\n\$\$\$\r?(?:\n|$)/mg;
	// Save the type
	const parseType = this.match[1];
	const renderType = this.match[2];
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	const start = this.parser.pos;
	// Look for the end of the block
	reEnd.lastIndex = this.parser.pos;
	const match = reEnd.exec(this.parser.source);
	let text;
	// Process the block
	if(match) {
		text = this.parser.source.substring(this.parser.pos,match.index);
		this.parser.pos = match.index + match[0].length;
	} else {
		text = this.parser.source.substr(this.parser.pos);
		this.parser.pos = this.parser.sourceLength;
	}
	// Parse the block according to the specified type
	const parser = this.parser.wiki.parseText(parseType,text,{defaultType: "text/plain"});
	// If there's no render type, just return the parse tree
	if(!renderType) {
		return parser.tree;
	} else {
		// Otherwise, render to the rendertype and return in a <PRE> tag
		const widgetNode = this.parser.wiki.makeWidget(parser);
		const container = $tw.fakeDocument.createElement("div");
		widgetNode.render(container,null);
		text = renderType === "text/html" ? container.innerHTML : container.textContent;
		return [{
			type: "element",
			tag: "pre",
			children: [{
				type: "text",
				text,
				start,
				end: this.parser.pos
			}]
		}];
	}
};
