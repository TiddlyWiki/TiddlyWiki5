/*\
title: $:/core/modules/parsers/newwikitextparser/rules/styleblock.js
type: application/javascript
module-type: wikitextrule

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

exports.name = "style";

exports.blockParser = true;

exports.regExpString = "@@[a-zA-Z0-9_\\-]+:.*;$";

exports.parse = function(match,isBlock) {
	var styles = {},
		tree = [],
		reStyleSpecififer = /@@([a-zA-Z0-9_\-]+):(.*);((?:\r?\n)?)/mg,
		reEndString = "@@",
		endMatch;
	// Look for the first style specifier
	reStyleSpecififer.lastIndex = this.pos;
	match = reStyleSpecififer.exec(this.source);
	while(match && match.index === this.pos) {
		// Save the style specified
		styles[match[1]] = match[2].trim();
		// Look to see if there is a further style specifier
		this.pos = match.index + match[0].length;
		reStyleSpecififer.lastIndex = this.pos;
		match = reStyleSpecififer.exec(this.source);
	}
	// Parse until we get to the end marker
	tree = this.parseBlocks(reEndString);
	for(var t=0; t<tree.length; t++) {
		tree[t].addStyles(styles);
	}
	return tree;
};

})();
