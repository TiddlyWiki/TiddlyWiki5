/*\
title: $:/core/modules/parsers/wikiparser/rules/styleblock.js
type: application/javascript
module-type: wikirule

Wiki text block rule for assigning styles and classes to paragraphs and other blocks. For example:

```
@@.myClass
@@background-color:red;
This paragraph will have the CSS class `myClass`.

* The `<ul>` around this list will also have the class `myClass`
* List item 2

@@
```

Note that classes and styles can be mixed subject to the rule that styles must precede classes. For example

```
@@.myFirstClass.mySecondClass
@@width:100px;.myThirdClass
This is a paragraph
@@
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "styleblock";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /@@((?:[^\.\r\n\s:]+:[^\r\n;]+;)+)?(?:\.([^\r\n\s]+))?\r?\n/mg;
};

exports.parse = function() {
	var reEndString = "^@@(?:\\r?\\n)?";
	var classes = [], styles = [];
	do {
		// Get the class and style
		if(this.match[1]) {
			styles.push(this.match[1]);
		}
		if(this.match[2]) {
			classes.push(this.match[2].split(".").join(" "));
		}
		// Move past the match
		this.parser.pos = this.matchRegExp.lastIndex;
		// Look for another line of classes and styles
		this.match = this.matchRegExp.exec(this.parser.source);
	} while(this.match && this.match.index === this.parser.pos);
	// Parse the body
	var tree = this.parser.parseBlocks(reEndString);
	for(var t=0; t<tree.length; t++) {
		if(classes.length > 0) {
			$tw.utils.addClassToParseTreeNode(tree[t],classes.join(" "));
		}
		if(styles.length > 0) {
			$tw.utils.addAttributeToParseTreeNode(tree[t],"style",styles.join(""));
		}
	}
	return tree;
};

exports.serialize = function(tree, serialize) {
	// tree: [{ type: 'element', tag: 'p', attributes: { class: { type: 'string', value: 'myClass' }, style: { type: 'string', value: 'background-color:red;' } }, children: [{ type: 'text', text: 'This paragraph will have the CSS class `myClass`.' }] }]
	// serialize: function that accepts array of nodes or a node and returns a string
	// Initialize the serialized string with the opening delimiter
	var serialized = "@@";
	// Check for styles and append them to the serialized string
	if(tree[0].attributes.style) {
		serialized += tree[0].attributes.style.value;
	}
	// Check for classes and append them to the serialized string
	if(tree[0].attributes.class) {
		var classes = tree[0].attributes.class.value.split(" ");
		for(var i = 0; i < classes.length; i++) {
			serialized += "." + classes[i];
		}
	}
	// Append the serialized children and the closing delimiter
	serialized += "\n" + serialize(tree) + "\n@@";
	// Return the complete serialized string
	return serialized;
};

})();
