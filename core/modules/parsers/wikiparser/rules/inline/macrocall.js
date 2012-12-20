/*\
title: $:/core/modules/parsers/wikiparser/rules/inline/macrocall.js
type: application/javascript
module-type: wiki-inline-rule

Wiki rule for macro calls

{{{
<<name value value2>>
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "macrocall";

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /<<([^\s>]+)\s*([\s\S]*?)>>/mg;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Get all the details of the match
	var macroName = this.match[1],
		paramString = this.match[2];
	// Move past the macro call
	this.parser.pos = this.matchRegExp.lastIndex;
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

})();
