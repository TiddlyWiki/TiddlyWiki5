/*\
title: $:/core/modules/parsers/wikiparser/rules/list.js
type: application/javascript
module-type: wikirule

Wiki text block rule for lists. For example:

```
* This is an unordered list
* It has two items

# This is a numbered list
## With a subitem
# And a third item

; This is a term that is being defined
: This is the definition of that term
```

Note that lists can be nested arbitrarily:

```
#** One
#* Two
#** Three
#**** Four
#**# Five
#**## Six
## Seven
### Eight
## Nine
```

A CSS class can be applied to a list item as follows:

```
* List item one
*.active List item two has the class `active`
* List item three
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "list";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /([\\*#;:]+)/mg;
};

var listTypes = {
	"*": {listTag: "ul", itemTag: "li"},
	"#": {listTag: "ol", itemTag: "li"},
	";": {listTag: "dl", itemTag: "dt"},
	":": {listTag: "dl", itemTag: "dd"}
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Array of parse tree nodes for the previous row of the list
	var listStack = [];
	// Cycle through the items in the list
	while(true) {
		// Match the list marker
		var reMatch = /(^[\*#;:]+)/mg;
		reMatch.lastIndex = this.parser.pos;
		var match = reMatch.exec(this.parser.source);
		if(!match || match.index !== this.parser.pos) {
			break;
		}
		// Check whether the list type of the top level matches
		var listInfo = listTypes[match[0].charAt(0)];
		if(listStack.length > 0 && listStack[0].tag !== listInfo.listTag) {
			break;
		}
		// Move past the list marker
		this.parser.pos = match.index + match[0].length;
		// Walk through the list markers for the current row
		for(var t=0; t<match[0].length; t++) {
			listInfo = listTypes[match[0].charAt(t)];
			// Remove any stacked up element if we can't re-use it because the list type doesn't match
			if(listStack.length > t && listStack[t].tag !== listInfo.listTag) {
				listStack.splice(t,listStack.length - t);
			}
			// Construct the list element or reuse the previous one at this level
			if(listStack.length <= t) {
				var listElement = {type: "element", tag: listInfo.listTag, children: [
					{type: "element", tag: listInfo.itemTag, children: []}
				]};
				// Link this list element into the last child item of the parent list item
				if(t) {
					var prevListItem = listStack[t-1].children[listStack[t-1].children.length-1];
					prevListItem.children.push(listElement);
				}
				// Save this element in the stack
				listStack[t] = listElement;
			} else if(t === (match[0].length - 1)) {
				listStack[t].children.push({type: "element", tag: listInfo.itemTag, children: []});
			}
		}
		if(listStack.length > match[0].length) {
			listStack.splice(match[0].length,listStack.length - match[0].length);
		}
		// Process the body of the list item into the last list item
		var lastListChildren = listStack[listStack.length-1].children,
			lastListItem = lastListChildren[lastListChildren.length-1],
			classes = this.parser.parseClasses();
		this.parser.skipWhitespace({treatNewlinesAsNonWhitespace: true});
		var tree = this.parser.parseInlineRun(/(\r?\n)/mg);
		lastListItem.children.push.apply(lastListItem.children,tree);
		if(classes.length > 0) {
			$tw.utils.addClassToParseTreeNode(lastListItem,classes.join(" "));
		}
		// Consume any whitespace following the list item
		this.parser.skipWhitespace();
	};
	// Return the root element of the list
	return [listStack[0]];
};

})();
