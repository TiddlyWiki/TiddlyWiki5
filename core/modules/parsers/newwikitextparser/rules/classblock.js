/*\
title: $:/core/modules/parsers/newwikitextparser/rules/classblock.js
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

exports.name = "class";

exports.blockParser = true;

exports.regExpString = "\\{\\{(?:[^\\{\\r\\n]+)\\{$\\r?\\n";

exports.parse = function(match,isBlock) {
	var tree = [],
		reStart = /\{\{([^\{\r\n]+){\r?\n/mg,
		reEnd = /(\}\}\}$(?:\r?\n)?)/mg,
		endMatch;
	reStart.lastIndex = this.pos;
	match = reStart.exec(this.source);
	if(match) {
		this.pos = match.index + match[0].length;
		tree = this.parseBlockTerminated(reEnd,match[1]);
	}
	return tree;
};

})();
