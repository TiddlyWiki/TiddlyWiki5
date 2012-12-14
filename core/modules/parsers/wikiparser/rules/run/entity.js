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

exports.name = "entity";

exports.init = function() {
	// Regexp to match
	this.matchRegExp = /(&#?[a-zA-Z0-9]{2,8};)/mg;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Get all the details of the match
	var entityString = this.match[1];
	// Move past the macro call
	this.parser.pos = this.matchRegExp.lastIndex;
	// Return the entity
	return [{type: "entity", entity: this.match[0]}];
};

})();
