/*\
title: $:/core/modules/parsers/newwikitextparser/rules/list.js
type: application/javascript
module-type: wikitextrule

Wiki text block rule for lists. For example:

{{{
* This is an unordered list
* It has two items

# This is a numbered list
## With a subitem
# And a third item

; This is a term that is being defined
: This is the definition of that term
}}}

Note that lists can be nested arbitrarily:

{{{
#** One
#* Two
#** Three
#**** Four
#**# Five
#**## Six
## Seven
### Eight
## Nine
}}}

A CSS class can be applied to a list item as follows:

{{{
* List item one
*{{active}} List item two has the class `active`
* List item three
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "list";

exports.blockParser = true;

exports.regExpString = "[\\*#;:]+";

var listTypes = {
	"*": {listTag: "ul", itemTag: "li"},
	"#": {listTag: "ol", itemTag: "li"},
	";": {listTag: "dl", itemTag: "dt"},
	":": {listTag: "dl", itemTag: "dd"}
};

/*

*/
exports.parse = function(match,isBlock) {
	var listStack = [], // Array containing list elements for the previous row in the list
		t, listInfo, listElement, itemElement, previousRootListTag;
	// Cycle through the rows in the list
	do {
		// Walk through the list markers for the current row
		for(t=0; t<match[0].length; t++) {
			listInfo = listTypes[match[0].charAt(t)];
			// Remove any stacked up element if we can't re-use it because the list type doesn't match
			if(listStack.length > t && listStack[t].type !== listInfo.listTag) {
				listStack.splice(t,listStack.length - t);
			}
			// Construct the list element or reuse the previous one at this level
			if(listStack.length <= t) {
				listElement = $tw.Tree.Element(listInfo.listTag,{},[$tw.Tree.Element(listInfo.itemTag,{},[])]);
				// Link this list element into the last child item of the parent list item
				if(t) {
					var prevListItem = listStack[t-1].children[listStack[t-1].children.length-1];
					prevListItem.children.push(listElement);
				}
				// Save this element in the stack
				listStack[t] = listElement;
			} else if(t === (match[0].length - 1)) {
				listStack[t].children.push($tw.Tree.Element(listInfo.itemTag,{},[]));
			}
		}
		if(listStack.length > match[0].length) {
			listStack.splice(match[0].length,listStack.length - match[0].length);
		}
		// Skip the list markers
		this.pos = match.index + match[0].length;
		// Process the body of the list item into the last list item
		var lastListInfo = listTypes[match[0].charAt(match[0].length-1)],
			lastListChildren = listStack[listStack.length-1].children,
			lastListItem = lastListChildren[lastListChildren.length-1],
			classedRun = this.parseClassedRun(/(\r?\n)/mg);
		for(t=0; t<classedRun.tree.length; t++) {
			lastListItem.children.push(classedRun.tree[t]);
		}
		if(classedRun["class"]) {
			lastListItem.addClass(classedRun["class"]);
		}
		// Remember the root list tag of this list item
		previousRootListTag = listStack[0].type;
		// Consume any whitespace following the list item
		this.skipWhitespace();
		// Lookahead to see if the next line is part of the same list
		var nextListItemRegExp = /(^[\*#;:]+)/mg;
		nextListItemRegExp.lastIndex = this.pos;
		match = nextListItemRegExp.exec(this.source);
		listInfo = match ? listTypes[match[0].charAt(0)] : null;
	} while(match && match.index === this.pos && listInfo && previousRootListTag === listInfo.listTag);
	// Return the root element of the list
	return [listStack[0]];
};

})();
