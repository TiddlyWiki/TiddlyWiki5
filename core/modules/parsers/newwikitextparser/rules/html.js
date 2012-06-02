/*\
title: $:/core/modules/parsers/newwikitextparser/blockrules/html.js
type: application/javascript
module-type: wikitextrule

Wiki text block rule for block level HTML elements

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
		reAttr = /\s*([A-Za-z\-_]+)(?:\s*=\s*(?:("[^"]*")|('[^']*')|([^"'\s]+)))?/mg;
	reStart.lastIndex = this.pos;
	var startMatch = reStart.exec(this.source);
	if(startMatch && startMatch.index === this.pos) {
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
		var reEnd = new RegExp("(</" + startMatch[1] + ">)","mg"),
			element = $tw.Tree.Element(startMatch[1],attributes,this.parseRun(reEnd));
		reEnd.lastIndex = this.pos;
		match = reEnd.exec(this.source);
		if(match && match.index === this.pos) {
			this.pos = match.index + match[0].length;
		}
		return [element];
	}
};

})();
