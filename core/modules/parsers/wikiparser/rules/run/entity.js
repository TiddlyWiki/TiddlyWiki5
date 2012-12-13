/*\
title: $:/core/modules/parsers/wikiparser/rules/run/entity.js
type: application/javascript
module-type: wikirunrule

Wiki text run rule for HTML entities. For example:

{{{
	This is a copyright symbol: &copy;
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var EntityRule = function(parser,startPos) {
	// Save state
	this.parser = parser;
	// Regexp to match
	this.reMatch = /(&#?[a-zA-Z0-9]{2,8};)/mg;
	// Get the first match
	this.matchIndex = startPos-1;
	this.findNextMatch(startPos);
};

EntityRule.prototype.findNextMatch = function(startPos) {
	if(this.matchIndex !== undefined && startPos > this.matchIndex) {
		this.reMatch.lastIndex = startPos;
		this.match = this.reMatch.exec(this.parser.source);
		this.matchIndex = this.match ? this.match.index : undefined;
	}
	return this.matchIndex;
};

/*
Parse the most recent match
*/
EntityRule.prototype.parse = function() {
	// Get all the details of the match
	var entityString = this.match[1];
	// Move past the macro call
	this.parser.pos = this.reMatch.lastIndex;
	// Return the entity
	return [{type: "entity", entity: this.match[0]}];
};

exports.EntityRule = EntityRule;

})();
