/*\
title: $:/core/modules/parsers/wikitextparser/rules/wikilink.js
type: application/javascript
module-type: wikitextrule

Wiki text run rule for wiki links. For example:

{{{
AWikiLink
AnotherLink
~SuppressedLink
}}}

Precede a camel case word with `~` to prevent it from being recognised as a link.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "wikilink";

exports.runParser = true;

var textPrimitives = {
	upperLetter: "[A-Z\u00c0-\u00de\u0150\u0170]",
	lowerLetter: "[a-z0-9_\\-\u00df-\u00ff\u0151\u0171]",
	anyLetter:   "[A-Za-z0-9_\\-\u00c0-\u00de\u00df-\u00ff\u0150\u0170\u0151\u0171]",
	anyLetterStrict: "[A-Za-z0-9\u00c0-\u00de\u00df-\u00ff\u0150\u0170\u0151\u0171]"
};

textPrimitives.unWikiLink = "~";
textPrimitives.wikiLink = textPrimitives.upperLetter + "+" +
	textPrimitives.lowerLetter + "+" +
	textPrimitives.upperLetter +
	textPrimitives.anyLetter + "*";

exports.regExpString = textPrimitives.unWikiLink + "?" + textPrimitives.wikiLink;

exports.parse = function(match,isBlock) {
	this.pos = match.index + match[0].length;
	// If the link starts with the unwikilink character then just output it as plain text
	if(match[0].substr(0,1) === textPrimitives.unWikiLink) {
		return [$tw.Tree.Text(match[0].substr(1))];
	}
	// If the link has been preceded with a letter then don't treat it as a link
	if(match.index > 0) {
		var preRegExp = new RegExp(textPrimitives.anyLetterStrict,"mg");
		preRegExp.lastIndex = match.index-1;
		var preMatch = preRegExp.exec(this.source);
		if(preMatch && preMatch.index === match.index-1) {
			return [$tw.Tree.Text(match[0])];
		}
	}
	var macroNode = $tw.Tree.Macro("link",{
		srcParams: {to: match[0]},
		content: [$tw.Tree.Text(match[0])],
		wiki: this.wiki
	});
	this.dependencies.mergeDependencies(macroNode.dependencies);
	return [macroNode];
};

})();
