/*\
title: $:/core/modules/parsers/wikiparser/rules/wikirule.js
type: application/javascript
module-type: global

Base class for wiki parser rules

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
This constructor is always overridden with a blank constructor, and so shouldn't be used
*/
var WikiRule = function() {
};

/*
To be overridden by individual rules
*/
WikiRule.prototype.init = function(parser) {
	this.parser = parser;
};

/*
Default implementation of findNextMatch uses RegExp matching
*/
WikiRule.prototype.findNextMatch = function(startPos) {
	this.matchRegExp.lastIndex = startPos;
	this.match = this.matchRegExp.exec(this.parser.source);
	return this.match ? this.match.index : undefined;
};

exports.WikiRule = WikiRule;

})();
