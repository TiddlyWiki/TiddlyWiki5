/*\
title: $:/core/modules/parsers/wikiparser/rules/run/macrocall.js
type: application/javascript
module-type: wikirunrule

Wiki rule for macro calls

{{{
<<name value value2>>
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var MacroCallRule = function(parser,startPos) {
	// Save state
	this.parser = parser;
	// Regexp to match
	this.reMatch = /<<([^\s>]+)\s*([\s\S]*?)>>/mg;
	// Get the first match
	this.matchIndex = startPos-1;
	this.findNextMatch(startPos);
};

MacroCallRule.prototype.findNextMatch = function(startPos) {
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
MacroCallRule.prototype.parse = function() {
	// Get all the details of the match
	var macroName = this.match[1],
		paramString = this.match[2];
	// Move past the macro call
	this.parser.pos = this.reMatch.lastIndex;
	var params = [],
		reParam = /\s*(?:([A-Za-z0-9\-_]+)\s*:)?(?:\s*(?:"([^"]*)"|'([^']*)'|\[\[([^\]]*)\]\]|([^"'\s]+)))/mg,
		paramMatch = reParam.exec(paramString);
	while(paramMatch) {
		// Process this parameter
		var paramInfo = {
			value: paramMatch[2] || paramMatch[3] || paramMatch[4] || paramMatch[5]
		};
		if(paramMatch[1]) {
			paramInfo.name = paramMatch[1];
		}
		params.push(paramInfo);
		// Find the next match
		paramMatch = reParam.exec(paramString);
	}
	return [{
		type: "macrocall",
		name: macroName,
		params: params
	}];
};

exports.MacroCallRule = MacroCallRule;

})();
