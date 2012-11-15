/*\
title: $:/core/modules/parsers/wikitextparser/rules/rule.js
type: application/javascript
module-type: wikitextrule

Wiki text block rule for rules. For example:

{{{
---
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "rule";

exports.blockParser = true;

exports.regExpString = "-{3,}\r?\n";

exports.parse = function(match,isBlock) {
	this.pos = match.index + match[0].length;
	return [$tw.Tree.Element("hr",{},[])];
};

})();
