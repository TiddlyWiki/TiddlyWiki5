/*\
title: $:/core/modules/parsers/wikiparser/rules/quote.js
type: application/javascript
module-type: wikirule

Wiki text block rule for quotes. For example:

```
> This is aquote
> It has two paragraphs

> This is another quite
>> This is a quoted quote
> And another paragraph
```

A CSS class can be applied to a quote item as follows:

```
> First quoted paragraph
>.active Second prargraph has the class `active`
> Third quoted paragraph
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "quote";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /(>+)/mg;
};

var quoteInfo = {quoteTag: "blockquote", paraTag: "p", attributes: { class: { type: "string", value:"tw-quote" }}};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Array of parse tree nodes for the previous row of the quote
	var quoteStack = [];
	// Cycle through the items in the quote
	while(true) {
		// Match the list marker
		var reMatch = /(>+)/mg;
		reMatch.lastIndex = this.parser.pos;
		var match = reMatch.exec(this.parser.source);
		if(!match || match.index !== this.parser.pos) {
			break;
		}
		// Move past the quote marker
		this.parser.pos = match.index + match[0].length;
		// Walk through the quote markers for the current row
		for(var t=0; t<match[0].length; t++) {
			// Construct the quote element or reuse the previous one at this level
			if(quoteStack.length <= t) {
				var quoteElement = {type: "element", tag: quoteInfo.quoteTag, attributes: quoteInfo.attributes, children: [
					{type: "element", tag: quoteInfo.paraTag, children: []}
				]};
				// Link this list element into the last child item of the parent list item
				if(t) {
					var prevQuoteItem = quoteStack[t-1].children[quoteStack[t-1].children.length-1];
					prevQuoteItem.children.push(quoteElement);
				}
				// Save this element in the stack
				quoteStack[t] = quoteElement;
			} else if(t === (match[0].length - 1)) {
				quoteStack[t].children.push({type: "element", tag: quoteInfo.paraTag, children: []});
			}
		}
		if(quoteStack.length > match[0].length) {
			quoteStack.splice(match[0].length,quoteStack.length - match[0].length);
		}
		// Process the body of the list item into the last list item
		var lastQuoteChildren = quoteStack[quoteStack.length-1].children,
			lastQuoteItem = lastQuoteChildren[lastQuoteChildren.length-1],
			classes = this.parser.parseClasses();
		this.parser.skipWhitespace({treatNewlinesAsNonWhitespace: true});
		var tree = this.parser.parseInlineRun(/(\r?\n)/mg);
		lastQuoteItem.children.push.apply(lastQuoteItem.children,tree);
		if(classes.length > 0) {
			$tw.utils.addClassToParseTreeNode(lastQuoteItem,classes.join(" "));
		}
		// Consume any whitespace following the list item
		this.parser.skipWhitespace();
	}
	// Return the root element of the list
	return [quoteStack[0]];
};

})();
