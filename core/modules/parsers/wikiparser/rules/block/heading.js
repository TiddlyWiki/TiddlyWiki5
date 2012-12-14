/*\
title: $:/core/modules/parsers/wikiparser/rules/block/heading.js
type: application/javascript
module-type: wikiblockrule

Wiki text block rule for headings

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "heading";

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /(!{1,6})/mg;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Get all the details of the match
	var headingLevel = this.match[1].length;
	// Move past the !s
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse the heading
	var classedRun = this.parser.parseClassedRun(/(\r?\n)/mg);
	// Return the heading
	return [{
		type: "element",
		tag: "h" + this.match[1].length, 
		attributes: {
			"class": {type: "string", value: classedRun["class"]}
		},
		children: classedRun.tree
	}];
};
})();
