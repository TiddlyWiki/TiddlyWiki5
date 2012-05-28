/*\
title: $:/core/modules/parsers/newwikitextparser/runrules/prettylink.js
type: application/javascript
module-type: wikitextrule

Wiki text run rule for pretty links

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "prettylink";

exports.runParser = true;

exports.regExpString = "\\[\\[";

exports.parse = function(match,isBlock) {
	var regExp = /\[\[(.*?)(?:\|(~)?(.*?))?\]\]/mg;
	regExp.lastIndex = this.pos;
	match = regExp.exec(this.source);
	if(match && match.index === this.pos) {
		var text = match[1],
			link = match[3] || text;
		this.pos = match.index + match[0].length;
		var macroNode = $tw.Tree.Macro("link",{
			srcParams: {to: link},
			content: [$tw.Tree.Text(text)],
			wiki: this.wiki
		});
		this.dependencies.mergeDependencies(macroNode.dependencies);
		return [macroNode];
	}
	return [];
};

})();
