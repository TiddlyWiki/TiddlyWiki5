/*\
title: $:/core/modules/parsers/newwikitextparser/rules/extlink.js
type: application/javascript
module-type: wikitextrule

Wiki text run rule for external links. For example:

{{{
An external link: http://www.tiddlywiki.com/

A suppressed external link: ~http://www.tiddlyspace.com/
}}}

External links can be suppressed by preceding them with `~`.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "extlink";

exports.runParser = true;

var unWikiLink = "~";

exports.regExpString = unWikiLink + "?(?:file|http|https|mailto|ftp|irc|news|data):[^\\s'\"]+(?:/|\\b)";

exports.parse = function(match,isBlock) {
	this.pos = match.index + match[0].length;
	if(match[0].substr(0,1) === unWikiLink) {
		return [$tw.Tree.Text(match[0].substr(1))];
	} else {
		var macroNode = $tw.Tree.Macro("link",{
			srcParams: {to: match[0]},
			content: [$tw.Tree.Text(match[0])],
			wiki: this.wiki
		});
		this.dependencies.mergeDependencies(macroNode.dependencies);
		return [macroNode];
	}
};

})();
