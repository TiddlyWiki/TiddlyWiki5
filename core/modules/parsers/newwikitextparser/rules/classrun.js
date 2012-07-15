/*\
title: $:/core/modules/parsers/newwikitextparser/rules/classrun.js
type: application/javascript
module-type: wikitextrule

Wiki text run rule for assigning classes to paragraphs and other blocks. For example:

{{{
{{myClass{This text will have the CSS class `myClass`.

* This will not be recognised as a list

List item 2}}}
}}}


\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "class";

exports.runParser = true;

exports.regExpString = "\\{\\{(?:[^\\{\\r\\n]+)\\{";

exports.parse = function(match,isBlock) {
	var tree,
		reStart = /\{\{([^\{\r\n]+){/mg,
		reEnd = /(\}\}\})/g;
	reStart.lastIndex = this.pos;
	match = reStart.exec(this.source);
	this.pos = match.index + match[0].length;
	tree = this.parseRun(reEnd,{leaveTerminator: false});
	return [$tw.Tree.Element("span",{"class":match[0]},tree)];
};

})();
