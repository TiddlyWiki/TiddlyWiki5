/*\
title: $:/core/modules/parsers/wikiparser/rules/wikirulebase.js
type: application/javascript
module-type: global

Base class for wiki parser rules

\*/

"use strict";

/*
This constructor is always overridden with a blank constructor, and so shouldn't be used
*/
var WikiRuleBase = function() {
};

/*
To be overridden by individual rules
*/
WikiRuleBase.prototype.init = function(parser) {
	this.parser = parser;
};

/*
Default implementation of findNextMatch uses RegExp matching
*/
WikiRuleBase.prototype.findNextMatch = function(startPos) {
	this.matchRegExp.lastIndex = startPos;
	this.match = this.matchRegExp.exec(this.parser.source);
	return this.match ? this.match.index : undefined;
};

exports.WikiRuleBase = WikiRuleBase;
