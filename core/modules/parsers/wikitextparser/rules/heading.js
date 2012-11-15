/*\
title: $:/core/modules/parsers/wikitextparser/rules/heading.js
type: application/javascript
module-type: wikitextrule

Wiki text block rule for headings. For example:

{{{
	! Level one heading

	A paragraph in level 1.

	!! Level two heading

	A paragraph in level 2.
}}}

The bang `!` must be the first thing on the line. Any white space before the text of the heading is ignored.

A CSS can be applied to the heading as follows:

{{{
!{{myClass}} This heading will have the class `myClass`
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "heading";

exports.blockParser = true;

exports.regExpString = "!{1,6}";

exports.parse = function(match,isBlock) {
	this.pos = match.index + match[0].length;
	var classedRun = this.parseClassedRun(/(\r?\n)/mg);
	return [$tw.Tree.Element("h" + match[0].length,{"class": classedRun["class"]},classedRun.tree)];
};

})();
