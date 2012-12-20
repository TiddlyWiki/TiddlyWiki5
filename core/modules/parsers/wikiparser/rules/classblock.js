/*\
title: $:/core/modules/parsers/wikiparser/rules/classblock.js
type: application/javascript
module-type: wikirule

Wiki text block rule for assigning classes to paragraphs and other blocks. For example:

{{{
{{myClass{
This paragraph will have the CSS class `myClass`.

* The `<ul>` around this list will also have the class `myClass`
* List item 2

 }}}
}}}

Note that the opening and closing braces both must be immediately followed by a newline.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "classblock";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\{\{([^\{\r\n]+)\{\r?\n/mg;
};

exports.parse = function() {
	var reEndString = "(\\}\\}\\}$(?:\\r?\\n)?)";
	// Get the class
	var classString = this.match[1];
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse the body
	var tree = this.parser.parseBlocks(reEndString);
	for(var t=0; t<tree.length; t++) {
		$tw.utils.addClassToParseTreeNode(tree[t],classString);
	}
	return tree;
};

})();
