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

var WikiRuleDefaultProperties = {};

/*
To be overridden by individual rules
*/
WikiRuleDefaultProperties.init = function() {

};

/*
Default implementation of findNextMatch looks uses RegExp matching
*/
WikiRuleDefaultProperties.findNextMatch = function(startPos) {
	this.matchRegExp.lastIndex = startPos;
	this.match = this.matchRegExp.exec(this.parser.source);
	return this.match ? this.match.index : undefined;
};

exports.WikiRuleDefaultProperties = WikiRuleDefaultProperties;

})();
