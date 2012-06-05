/*\
title: $:/core/modules/parsers/newwikitextparser/rules/emphasis.js
type: application/javascript
module-type: wikitextrule

Wiki text run rule for emphasis. For example:

{{{
	This is ''bold'' text

	This is //italic// text

	This is __underlined__ text

	This is ^^superscript^^ text

	This is ~~subscript~~ text

	This is --strikethrough-- text
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "emphasis";

exports.runParser = true;

exports.regExpString = "''|\/\/|__|\\^\\^|~~|--(?!\\s|$)";

exports.parse = function(match,isBlock) {
	this.pos = match.index + match[0].length;
	var el,regExp;
	switch(match[0]) {
		case "''": // Bold
			el = "strong";
			regExp = /('')|(\r?\n)/mg;
			break;
		case "//": // Italics
			el = "em";
			regExp = /(\/\/)|(\r?\n)/mg;
			break;
		case "__": // Underline
			el = "u";
			regExp = /(__)|(\r?\n)/mg;
			break;
		case "^^":
			el = "sup";
			regExp = /(\^\^)|(\r?\n)/mg;
			break;
		case "~~":
			el = "sub";
			regExp = /(~~)|(\r?\n)/mg;
			break;
		case "--":
			el = "strike";
			regExp = /(--)|(\r?\n)/mg;
			break;
	}
	// Parse the run up to the terminator
	var tree = this.parseRun(regExp,{leaveTerminator: true});
	// Check for the terminator
	regExp.lastIndex = this.pos;
	match = regExp.exec(this.source);
	if(match && match.index === this.pos) {
		// Only consume the terminator if it isn't a line break
		if(match[1]) {
			this.pos = match.index + match[0].length;
		}
	}
	return [$tw.Tree.Element(el,{},tree)];
};

})();
