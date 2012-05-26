/*\
title: $:/core/modules/parsers/newwikitextparser/blockrules/rule.js
type: application/javascript
module-type: wikitextblockrule

Wiki text block rule for rules

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "rule";

exports.regExpString = "-{3,}\r?\n";

exports.parse = function(match) {
	this.pos = match.index + match[0].length;
	return [$tw.Tree.Element("hr",{},[])];
};

})();
