/*\
title: js/WikiTextProcessor.js

\*/
(function(){

/*jslint node: true */
"use strict";

var WikiTextRules = require("./WikiTextRules.js"),
	WikiTextParser = require("./WikiTextParser.js").WikiTextParser;

/*
Creates a new instance of the wiki text processor with the specified options. The
options are a hashmap of mandatory members as follows:

	textProcessors: The TextProcessors object to use to parse any cascaded content (eg transclusion)

Planned:

	enableRules: An array of names of wiki text rules to enable. If not specified, all rules are available
	extraRules: An array of additional rule handlers to add
	enableMacros: An array of names of macros to enable. If not specified, all macros are available
	extraMacros: An array of additional macro handlers to add
*/
var WikiTextProcessor = function(options) {
	this.rules = WikiTextRules.rules;
	var pattern = [];
	for(var n=0; n<this.rules.length; n++) {
		pattern.push("(" + this.rules[n].match + ")");
	}
	this.rulesRegExp = new RegExp(pattern.join("|"),"mg");
};

WikiTextProcessor.prototype.parse = function(text) {
	return new WikiTextParser(text,this);
};

exports.WikiTextProcessor = WikiTextProcessor;

})();
