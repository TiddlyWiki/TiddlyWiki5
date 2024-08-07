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
	return [{
		type: "void",
		children: tree
	}]
};

exports.serialize = function(tree, serialize) {
	// serialize: function that serializes an array of nodes or a single node to a string
	var result = [];
	var classes = [];
	var styles = [];

	// Collect all unique classes and styles from child nodes
	for(var i = 0; i < tree.children.length; i++) {
		var node = tree.children[i];
		if(node.attributes && node.attributes.class) {
			var nodeClasses = node.attributes.class.value.split(" ");
			for(var j = 0; j < nodeClasses.length; j++) {
				if(classes.indexOf(nodeClasses[j]) === -1) {
					classes.push(nodeClasses[j]);
				}
			}
		}
		if(node.attributes && node.attributes.style) {
			var nodeStyles = node.attributes.style.value.split(";");
			for(var k = 0; k < nodeStyles.length; k++) {
				var style = nodeStyles[k].trim();
				if(style && styles.indexOf(style) === -1) {
					styles.push(style);
				}
			}
		}
	}

	// Add the style block header if there are any classes or styles
	if(classes.length > 0 || styles.length > 0) {
		if(styles.length > 0) {
			result.push("@@");
			result.push(styles.join(";"));
			result.push(";\n");
		}
		if(classes.length > 0) {
			result.push("@@.");
			result.push(classes.join("."));
			result.push("\n");
		}
	}

	// Serialize each child node and add to result
	for(var i = 0; i < tree.children.length; i++) {
		result.push(serialize(tree.children[i]));
	}

	// Add the closing @@ for the style block
	result.push("@@");
	return result.join("");
};

})();
