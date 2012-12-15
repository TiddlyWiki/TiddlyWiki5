/*\
title: $:/core/modules/parsers/wikiparser/rules/run/dash.js
type: application/javascript
module-type: wikirunrule

Wiki text run rule for dashes. For example:

{{{
This is an en-dash: --

This is an em-dash: ---
}}}

Dashes must be followed by whitespace in order to be distinguished from strikethrough notation (`--strikethrough--`).

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "dash";

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /-{2,3}(?=\s)/mg;
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
