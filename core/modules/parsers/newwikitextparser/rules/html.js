/*\
title: $:/core/modules/parsers/newwikitextparser/rules/html.js
type: application/javascript
module-type: wikitextrule

Wiki text block rule for block and run level HTML elements. For example:

{{{
<aside>
This is an HTML5 aside element
</aside>
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "html";

exports.blockParser = true;
exports.runParser = true;

exports.regExpString = "<[A-Za-z]+\\s*[^>]*>";

exports.parse = function(match,isBlock) {
	var reStart = /<([A-Za-z]+)(\s*[^>]*)>/mg,
		reLineBreak = /(\r?\n)/mg,
		reAttr = /\s*([A-Za-z\-_]+)(?:\s*=\s*(?:("[^"]*")|('[^']*')|([^"'\s]+)))?/mg;
	// Process the start regexp to get the attribute portion
	reStart.lastIndex = this.pos;
	var startMatch = reStart.exec(this.source);
	if(startMatch && startMatch.index === this.pos) {
		// Process the attributes
		var attrMatch = reAttr.exec(startMatch[2]),
			attributes = {};
		while(attrMatch) {
			var name = attrMatch[1],
				value;
			if(attrMatch[2]) { // Double quoted
				value = attrMatch[2].substring(1,attrMatch[2].length-1);
			} else if(attrMatch[3]) { // Single quoted
				value = attrMatch[3].substring(1,attrMatch[3].length-1);
			} else if(attrMatch[4]) { // Unquoted
				value = attrMatch[4];
			} else { // Valueless
				value = true; // TODO: We should have a way of indicating we want an attribute without a value
			}
			attributes[name] = value;
			attrMatch = reAttr.exec(startMatch[2]);
		}
		this.pos = startMatch.index + startMatch[0].length;
		// Check for a line break immediate after the opening tag
		reLineBreak.lastIndex = this.pos;
		var lineBreakMatch = reLineBreak.exec(this.source);
		if(lineBreakMatch && lineBreakMatch.index === this.pos) {
			this.pos = lineBreakMatch.index + lineBreakMatch[0].length;
			isBlock = true;
		} else {
			isBlock = false;
		}
		var reEndString = "(</" + startMatch[1] + ">)",
			reEnd = new RegExp(reEndString,"mg"),
			content;
		if(isBlock) {
			content = this.parseBlocks(reEndString);
		} else {
			content = this.parseRun(reEnd);
		}
		var element = $tw.Tree.Element(startMatch[1],attributes,content);
		reEnd.lastIndex = this.pos;
		match = reEnd.exec(this.source);
		if(match && match.index === this.pos) {
			this.pos = match.index + match[0].length;
		}
		return [element];
	}
};

})();
