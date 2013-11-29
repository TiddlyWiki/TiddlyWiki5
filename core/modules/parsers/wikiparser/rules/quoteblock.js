/*\
title: $:/core/modules/parsers/wikiparser/rules/quoteblock.js
type: application/javascript
module-type: wikirule

Wiki text rule for quote blocks. For example:

```
	""".optionalClass(es) (optional cited from)
	a quote
	"""
	
	"""
	a quote
	""" (optional cited from)
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
	this.matchRegExp = /"""(?:\.([^\r\n\s]+))?[\t ]*(?:\(([^\r\n]*)\))?\r?\n/mg;
};

exports.parse = function() {
	var reEndCite= '(?:\\(([^\\r\\n]*)\\))?(?:\\r?\\n|$)';
	var reEndString = '^"""[\\t ]*(?='+reEndCite+')';
	var classes = "tw-quote", cite = "";
	if(this.match[1]) {
		classes+= " " + this.match[1].replace(/\./, " ");
	}
	if(this.match[2]) {
		cite= this.match[2];
	}
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse the body
	var tree = this.parser.parseBlocks(reEndString);

	// now check for a cite
	var terminatorRegExp = new RegExp(reEndCite, "mg");
	terminatorRegExp.lastIndex = this.parser.pos;
	var match = terminatorRegExp.exec(this.parser.source);

	// If we got a match, take it as the cite
	if ( match[1] ) {
		tree.push({
			type: "element",
			tag: "cite",
			children: [{
				type: "text",
				text: match[1]
			}]
		});
	}
	this.parser.pos = match.index + match[0].length;
	if ( cite != "" ) {
		tree.unshift({
			type: "element",
			tag: "cite",
			children: [{
				type: "text",
				text: cite
			}]
		});
	}
	// Return the blockquote element
	return [{
		type: "element",
		tag: "blockquote",
		attributes: {
			class: { type: "string", value: classes },
		},
		children: tree
	}];
};

})();
