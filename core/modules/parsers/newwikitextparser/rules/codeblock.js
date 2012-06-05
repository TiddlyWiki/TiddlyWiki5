/*\
title: $:/core/modules/parsers/newwikitextparser/rules/codeblock.js
type: application/javascript
module-type: wikitextrule

Wiki text run rule for code blocks. For example:

{{{
	{{{
	This text will not be //wikified//
	}}}
}}}

Note that the opening curly braces and the closing curly braces must each be on a line of their own, and not be preceded or followed by white space.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "codeblock";

exports.blockParser = true;

exports.regExpString = "\\{\\{\\{\\r?\\n";

exports.parse = function(match,isBlock) {
	this.pos = match.index + match[0].length;
	var regExp = /(\r?\n\}\}\}$)/mg,
		text;
	regExp.lastIndex = this.pos;
	match = regExp.exec(this.source);
	if(match) {
		text = this.source.substring(this.pos,match.index);
		this.pos = match.index + match[0].length;
	} else {
		text = this.source.substr(this.pos);
		this.pos = this.sourceLength;
	}
	return [$tw.Tree.Element("pre",{},[$tw.Tree.Text(text)])];
};

})();
