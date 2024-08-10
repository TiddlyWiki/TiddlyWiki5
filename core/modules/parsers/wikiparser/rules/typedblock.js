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
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var widget = require("$:/core/modules/widgets/widget.js");

exports.name = "typedblock";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\$\$\$([^ >\r\n]*)(?: *> *([^ \r\n]+))?\r?\n/mg;
};

exports.parse = function() {
	var reEnd = /\r?\n\$\$\$\r?(?:\n|$)/mg;
	// Save the type
	var parseType = this.match[1],
		renderType = this.match[2];
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	var start = this.parser.pos;
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
		return  [{
			type: "void",
			children: $tw.utils.isArray(parser.tree) ? parser.tree : [parser.tree],
			parseType: parseType,
			renderType: renderType,
			text: text,
			start: start,
			end: this.parser.pos
		}];
	} else {
		// Otherwise, render to the rendertype and return in a <PRE> tag
		var widgetNode = this.parser.wiki.makeWidget(parser),
			container = $tw.fakeDocument.createElement("div");
		widgetNode.render(container,null);
		var renderResult = renderType === "text/html" ? container.innerHTML : container.textContent;
		// Use void node to carry important info for typedblock
		return [{
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
		}];
	}
};

exports.serialize = function (tree, serialize) {
	if(tree.type === "void") {
		return "$$$" + tree.parseType + (tree.renderType ? " > " + tree.renderType : "") + "\n" + tree.text + "\n$$$\n\n";
	}
	return "";
};

})();
