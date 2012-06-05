/*\
title: $:/core/modules/parsers/newwikitextparser/rules/extlink.js
type: application/javascript
module-type: wikitextrule

Wiki text run rule for external links

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "extlink";

exports.runParser = true;
exports.blockParser = true;

exports.regExpString = "(?:file|http|https|mailto|ftp|irc|news|data):[^\\s'\"]+(?:/|\\b)";

exports.parse = function(match,isBlock) {
	this.pos = match.index + match[0].length;
	var macroNode = $tw.Tree.Macro("link",{
		srcParams: {to: match[0]},
		content: [$tw.Tree.Text(match[0])],
		wiki: this.wiki
	});
	this.dependencies.mergeDependencies(macroNode.dependencies);
	return [macroNode];
};

})();
