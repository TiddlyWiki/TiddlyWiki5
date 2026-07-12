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

"use strict";

exports.name = "styleinline";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match /@@(styles)?\s*(\.class\s+)?/
	this.matchRegExp = /@@((?:[^\.\r\n\s:]+:[^\r\n;]+;)+)?(\.(?:[^\r\n\s]+)\s+)?/mg;
};

exports.parse = function() {
	// The run ends at its closing delimiter or at the end of its block, whichever arrives first
	var reEnd = /@@|\r?\n\r?\n/g;
	// Get the styles and class
	var stylesString = this.match[1],
		classString = this.match[2] ? this.match[2].split(".").join(" ") : undefined;
	var delimiterStart = this.parser.pos,
		delimiterText = this.match[0];
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse the run up to the terminator
	var bodyStart = this.parser.pos;
	var ex = this.parser.parseInlineRunTerminatedExtended(reEnd,{eatTerminator: true});
	if(!ex.match || /^\r?\n/.test(ex.match[0])) {
		// The run reached the end of the source without a closer, so the delimiter rewinds to literal text and parsing resumes after it
		this.parser.pos = bodyStart;
		this.parser.addDiagnostic({
			from: delimiterStart,
			to: bodyStart,
			severity: "warning",
			code: "unterminated-styleinline",
			message: "Unmatched inline style delimiter rendered as literal text"
		});
		return [{type: "text", text: delimiterText, start: delimiterStart, end: bodyStart, isRecovered: true}];
	}
	var tree = ex.tree;
	// Return the classed span
	var node = {
		type: "element",
		tag: "span",
		children: tree
	};
	if(classString) {
		$tw.utils.addClassToParseTreeNode(node,classString);
	}
	if(stylesString) {
		$tw.utils.addAttributeToParseTreeNode(node,"style",stylesString);
	}
	if(!classString && !stylesString) {
		$tw.utils.addClassToParseTreeNode(node,"tc-inline-style");
	}
	return [node];
};
