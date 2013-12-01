/*\
title: $:/core/modules/parsers/wikiparser/rules/quoteblock.js
type: application/javascript
module-type: wikirule

Wiki text rule for quote blocks. For example:

```
	<<<.optionalClass(es) optional cited from
	a quote
	<<<
	
	<<<.optionalClass(es)
	a quote
	<<< optional cited from
```

Quotes can be quoted by putting more <s

```
	<<<
	Quote Level 1
	
	<<<<
	QuoteLevel 2
	<<<<
	
	<<<
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "quoteblock";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /(<<<+)/mg;
};

exports.parse = function() {
	var classes = ["tw-quote"];
	// Get all the details of the match
	var reEndString = "^" + this.match[1] + "(?!<)";
	// Move past the <s
	this.parser.pos = this.matchRegExp.lastIndex;
	
	// Parse any classes, whitespace and then the optional cite itself
	classes.push.apply(classes, this.parser.parseClasses());
	this.parser.skipWhitespace({treatNewlinesAsNonWhitespace: true});
	var cite = this.parser.parseInlineRun(/(\r?\n)/mg);

	// before handling the cite, parse the body of the quote
	var tree= this.parser.parseBlocks(reEndString);
	// If we got a cite, put it before the text
	if ( cite.length > 0 ) {
		tree.unshift({
			type: "element",
			tag: "cite",
			children: cite
		});
	}

	// Move past the <s
	this.parser.pos = this.matchRegExp.lastIndex;
	
	// Parse any optional cite
	this.parser.skipWhitespace({treatNewlinesAsNonWhitespace: true});
	cite = this.parser.parseInlineRun(/(\r?\n)/mg);
	// If we got a cite, push it
	if ( cite.length > 0 ) {
		tree.push({
			type: "element",
			tag: "cite",
			children: cite
		});
	}

	// Return the blockquote element
	return [{
		type: "element",
		tag: "blockquote",
		attributes: {
			class: { type: "string", value: classes.join(" ") },
		},
		children: tree
	}];
};

})();
