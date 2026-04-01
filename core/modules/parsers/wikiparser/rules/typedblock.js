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

exports.name = "typedblock";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match opening $$$. The rest of the opening line (type, render type, optional anchor)
	// is parsed by parseInlineRun so that the inline anchor rule can process ^id.
	this.matchRegExp = /\$\$\$/mg;
};

exports.parse = function() {
	var reEnd = /\r?\n\$\$\$\r?(?:\n|$)/mg;
	// Move past the $$$ marker
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse the rest of the opening line using inline rules
	var openingLineNodes = this.parser.parseInlineRun(/(\r?\n)/mg);
	// Skip past the terminating newline
	if(this.parser.pos < this.parser.sourceLength && this.parser.source[this.parser.pos] === "\n") {
		this.parser.pos++;
	} else if(this.parser.pos + 1 < this.parser.sourceLength && this.parser.source.substr(this.parser.pos, 2) === "\r\n") {
		this.parser.pos += 2;
	}
	// Extract parseType and renderType from the first text node
	var parseType = "", renderType;
	if(openingLineNodes.length > 0 && openingLineNodes[0].type === "text" && openingLineNodes[0].text) {
		var typeMatch = openingLineNodes[0].text.match(/^([^ >\r\n]*)(?: *> *([^ \r\n]+))?/);
		if(typeMatch) {
			parseType = typeMatch[1] || "";
			renderType = typeMatch[2];
		}
	}
	var start = this.parser.pos;
	// Store opening line nodes for anchor detection by wrapAnchorsInTree
	var savedOpeningLineNodes = openingLineNodes;
	// Look for the end of the block
	reEnd.lastIndex = this.parser.pos;
	var match = reEnd.exec(this.parser.source),
		text;
	// Process the block
	if(match) {
		text = this.parser.source.substring(this.parser.pos,match.index);
		this.parser.pos = match.index + match[0].length;
	} else {
		text = this.parser.source.substr(this.parser.pos);
		this.parser.pos = this.parser.sourceLength;
	}
	// Parse the block according to the specified type
	var parser = this.parser.wiki.parseText(parseType,text,{defaultType: "text/plain"});
	// If there's no render type, just return the parse tree
	if(!renderType) {
		var voidNode = {
			type: "void",
			children: $tw.utils.isArray(parser.tree) ? parser.tree : [parser.tree],
			parseType: parseType,
			renderType: renderType,
			text: text,
			start: start,
			end: this.parser.pos
		};
		if(savedOpeningLineNodes.length > 0) voidNode.openingLineNodes = savedOpeningLineNodes;
		return [voidNode];
	} else {
		// Otherwise, render to the rendertype and return in a <PRE> tag
		var widgetNode = this.parser.wiki.makeWidget(parser),
			container = $tw.fakeDocument.createElement("div");
		widgetNode.render(container,null);
		var renderResult = renderType === "text/html" ? container.innerHTML : container.textContent;
		// Use void node to carry important info for typedblock
		var voidNode2 = {
			type: "void",
			children: [{
				type: "element",
				tag: "pre",
				children: [{
					type: "text",
					text: renderResult,
				}]
			}],
			parseType: parseType,
			renderType: renderType,
			text: text,
			start: start,
			end: this.parser.pos
		};
		if(savedOpeningLineNodes.length > 0) voidNode2.openingLineNodes = savedOpeningLineNodes;
		return [voidNode2];
	}
};
