/*\
title: $:/core/modules/parsers/wikiparser/rules/inline/classinline.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for assigning classes to runs of text. For example:

{{{
{{myClass{This text will have the CSS class `myClass`.

* This will not be recognised as a list

List item 2}}}
}}}


\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "classinline";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /\{\{([^\{\r\n]+)\{/mg;
};

exports.parse = function() {
	var reEnd = /(\}\}\})/g;
	// Get the class
	var classString = this.match[1];
	// Move past the match
	this.parser.pos = this.matchRegExp.lastIndex;
	// Parse the run up to the terminator
	var tree = this.parser.parseInlineRun(reEnd,{eatTerminator: true});
	// Return the classed span
	return [{
		type: "element",
		tag: "span",
		attributes: {
			"class": {type: "string", value: classString}
		},
		children: tree
	}];
};

})();
