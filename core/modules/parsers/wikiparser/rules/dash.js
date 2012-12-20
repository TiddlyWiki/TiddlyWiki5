/*\
title: $:/core/modules/parsers/wikiparser/rules/dash.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for dashes. For example:

{{{
This is an en-dash: --

This is an em-dash: ---
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "dash";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /-{2,3}[^-]/mg;
};

exports.parse = function() {
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	var dash = this.match[0].length === 2 ? "&ndash;" : "&mdash;";
	return [{
		type: "entity",
		entity: dash
	}];
};

})();
