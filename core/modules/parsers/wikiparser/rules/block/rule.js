/*\
title: $:/core/modules/parsers/wikiparser/rules/block/rule.js
type: application/javascript
module-type: wikiblockrule

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

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /-{3,}\r?\n/mg;
};

exports.parse = function(match,isBlock) {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	return [{type: "element", tag: "hr"}];
};

})();
