/*\
title: $:/core/modules/parsers/wikiparser/rules/styleinline.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for assigning styles and classes to inline runs. For example:

```
@@.myClass This is some text with a class@@
@@background-color:red;This is some text with a background colour@@
@@width:100px;.myClass This is some text with a class and a width@@
```


\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "styleinline";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /@@((?:[^\.\r\n\s:]+:[^\r\n;]+;)+)?(\.(?:[^\r\n\s]+)\s+)?/mg;
};

exports.parse = function() {
	var reEnd = /@@/g;
	// Get the styles and class
	var stylesString = this.match[1],
		classString = this.match[2] ? this.match[2].split(".").join(" ") : undefined;
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse the run up to the terminator
	var tree = this.parser.parseInlineRun(reEnd,{eatTerminator: true});
	// Return the classed span
	var node = {
		type: "element",
		tag: "span",
		attributes: {
			"class": {type: "string", value: "tc-inline-style"}
		},
		children: tree
	};
	if(classString) {
		$tw.utils.addClassToParseTreeNode(node,classString);
	}
	if(stylesString) {
		$tw.utils.addAttributeToParseTreeNode(node,"style",stylesString);
	}
	return [node];
};

})();
