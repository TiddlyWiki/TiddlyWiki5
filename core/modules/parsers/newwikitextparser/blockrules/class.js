/*\
title: $:/core/modules/parsers/newwikitextparser/blockrules/class.js
type: application/javascript
module-type: wikitextblockrule

Wiki text block rule for assigning classes to paragraphs and other blocks

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "class";

exports.regExpString = "\\{\\{(?:[^\\{\\r\\n]*)\\{$";

exports.parse = function(match) {
	var tree = [],
		reStart = /\{\{([^\{\r\n]*){(?:\r?\n)?/mg,
		reEnd = /(\}\}\}$(?:\r?\n)?)/mg,
		endMatch;
	reStart.lastIndex = this.pos;
	match = reStart.exec(this.source);
	if(match) {
		this.pos = match.index + match[0].length;
		// Skip any whitespace
		this.skipWhitespace();
		//  Check if we've got the end marker
		reEnd.lastIndex = this.pos;
		endMatch = reEnd.exec(this.source);
		// Parse the text into blocks
		while(this.pos < this.sourceLength && !(endMatch && endMatch.index === this.pos)) {
			var blocks = this.parseBlock();
			for(var t=0; t<blocks.length; t++) {
				blocks[t].addClass(match[1]);
				tree.push(blocks[t]);
			}
			// Skip any whitespace
			this.skipWhitespace();
			//  Check if we've got the end marker
			reEnd.lastIndex = this.pos;
			endMatch = reEnd.exec(this.source);
		}
		reEnd.lastIndex = this.pos;
		endMatch = reEnd.exec(this.source);
		if(endMatch) {
			this.pos = endMatch.index + endMatch[0].length;
		}
		return tree;
	}
};

})();
