/*\
title: $:/core/modules/parsers/wikitextparser/rules/macro.js
type: application/javascript
module-type: wikitextrule

Wiki text rule for macros

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "macro";

exports.runParser = true;
exports.blockParser = true;

exports.regExpString = "<<(?:(?:[!@£\\$%\\^\\&\\*\\(\\)`\\~'\"\\|\\\\\\/;\\:\\.\\,\\+\\=\\-\\_\\{\\}])|(?:[^>\\s]+))(?:\\s*)(?:(?:[^>]|(?:>(?!>|<)))*)>(?:>|<)";

exports.parse = function(match,isBlock) {
	var regExp = /<<(?:([!@£\$%\^\&\*\(\)`\~'"\|\\\/;\:\.\,\+\=\-\_\{\}])|([^>\s]+))(?:\s*)((?:[^>]|(?:>(?!>|<)))*)>(?:(>)|(<))/mg,
		reLineBreak = /(\r?\n)/mg,
		content = [];
	regExp.lastIndex = this.pos;
	match = regExp.exec(this.source);
	if(match && match.index === this.pos) {
		this.pos = match.index + match[0].length;
		if(match[5]) {
			// Look for a line break immediately after the `><` to trigger block mode
			reLineBreak.lastIndex = this.pos;
			var lineBreakMatch = reLineBreak.exec(this.source);
			if(lineBreakMatch && lineBreakMatch.index === this.pos) {
				this.pos = lineBreakMatch.index + lineBreakMatch[0].length;
				isBlock = true;
			} else {
				isBlock = false;
			}
			// If the macro has content then parse it as a block or run
			if(isBlock) {
				content = this.parseBlocks(">>");
			} else {
				content = this.parseRun(/(>>)/mg);
			}
		}
		var macroName = match[1] || match[2];
		if(macroName in $tw.wiki.macros) {
			var macroNode = $tw.Tree.Macro(match[1] || match[2],{
					srcParams: match[3],
					content: content,
					isBlock: isBlock,
					wiki: this.wiki
				});
			this.dependencies.mergeDependencies(macroNode.dependencies);
			return [macroNode];
		} else {
			console.log("Missing macro '" + macroName + "'");
		}
	}
	return [];
};

})();
