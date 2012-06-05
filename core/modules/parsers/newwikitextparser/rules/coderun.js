/*\
title: $:/core/modules/parsers/newwikitextparser/rules/coderun.js
type: application/javascript
module-type: wikitextrule

Wiki text run rule for code runs. For example:

{{{
	This is a {{{code run}} and `so is this`.
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "coderun";

exports.runParser = true;

exports.regExpString = "(?:\\{\\{\\{)|(?:`)";

exports.parse = function(match,isBlock) {
	this.pos = match.index + match[0].length;
	var regExp,
		text;
	if(match[0] === "{{{") {
		regExp = /(\}\}\})/mg;
	} else {
		regExp = /(`)/mg;
	}
	regExp.lastIndex = this.pos;
	match = regExp.exec(this.source);
	if(match) {
		text = this.source.substring(this.pos,match.index);
		this.pos = match.index + match[0].length;
	} else {
		text = this.source.substr(this.pos);
		this.pos = this.sourceLength;
	}
	return [$tw.Tree.Element("code",{},[$tw.Tree.Text(text)])];
};

})();
