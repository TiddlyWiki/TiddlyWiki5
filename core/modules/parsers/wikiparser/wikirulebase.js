/*\
title: $:/core/modules/parsers/wikiparser/rules/wikirulebase.js
type: application/javascript
module-type: global
\*/

"use strict";

var WikiRuleBase = function() {
};

WikiRuleBase.prototype.init = function(parser) {
	this.parser = parser;
};

WikiRuleBase.prototype.findNextMatch = function(startPos) {
	this.matchRegExp.lastIndex = startPos;
	this.match = this.matchRegExp.exec(this.parser.source);
	return this.match ? this.match.index : undefined;
};

exports.WikiRuleBase = WikiRuleBase;
