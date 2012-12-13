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

var HeadingRule = function(parser,startPos) {
	// Save state
	this.parser = parser;
	// Regexp to match
	this.reMatch = /(!{1,6})/mg;
	// Get the first match
	this.matchIndex = startPos-1;
	this.findNextMatch(startPos);
};

HeadingRule.prototype.findNextMatch = function(startPos) {
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
HeadingRule.prototype.parse = function() {
	// Get all the details of the match
	var headingLevel = this.match[1].length;
	// Move past the !s
	this.parser.pos = this.reMatch.lastIndex;
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

exports.HeadingRule = HeadingRule;

})();
