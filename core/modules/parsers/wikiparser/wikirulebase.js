/*\
title: $:/core/modules/parsers/wikiparser/rules/wikirulebase.js
type: application/javascript
module-type: global

Base class for wiki parser rules

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/**
 * @typedef {import('../base').Parser} Parser
 */

/**
 * Base class for wiki rules.
 * This constructor is always overridden with a blank constructor, and so shouldn't be used
 * 
 * @class
 * @constructor
 */
function WikiRuleBase() {
	/**
	 * Inject by parser
	 * @type {Record<"pragma"|"block"|"inline", boolean>}
	 */
	this.is = {};
	/**
	 * @type {RegExp}
	 */
	this.matchRegExp;
};

/**
 * Initialize rule with given parser instance
 * To be overridden by individual rules
 * 
 * @param {Parser} parser - Parser instance to initialize with
 */
WikiRuleBase.prototype.init = function(parser) {
	this.parser = parser;
};

/**
 * Default implementation of findNextMatch uses RegExp matching
 * Find next match in source starting from given position using RegExp matching
 * 
 * @param {number} startPos - Position to start searching from
 * @returns {number|undefined} Index of next match or undefined if no match is found
 */
WikiRuleBase.prototype.findNextMatch = function(startPos) {
	this.matchRegExp.lastIndex = startPos;
	this.match = this.matchRegExp.exec(this.parser.source);
	return this.match ? this.match.index : undefined;
};

exports.WikiRuleBase = WikiRuleBase;

})();
