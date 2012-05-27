/*\
title: $:/core/modules/parsers/newwikitextparser/runrules/macro.js
type: application/javascript
module-type: wikitextrule

Wiki text run rule for pretty links

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "macro";

exports.runParser = true;
exports.blockParser = true;

exports.regExpString = "<<";

exports.parse = function(match) {
	var regExp = /<<(?:([!@£\$%\^\&\*\(\)`\~'"\|\\\/;\:\.\,\+\=\-\_\{\}])|([^>\s]+))(?:\s*)((?:[^>]|(?:>(?!>)))*)>>/mg;
	regExp.lastIndex = this.pos;
	match = regExp.exec(this.source);
	if(match && match.index === this.pos) {
		this.pos = match.index + match[0].length;
		var macroNode = $tw.Tree.Macro(match[1] || match[2],match[3],[],this.wiki);
		this.dependencies.mergeDependencies(macroNode.dependencies);
		return [macroNode];
	}
	return [];
};

})();
