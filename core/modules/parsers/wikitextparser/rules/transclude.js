/*\
title: $:/core/modules/parsers/wikitextparser/rules/transclude.js
type: application/javascript
module-type: wikitextrule

Wiki text rule for transclusion. For example:

{{{
((MyTiddler))
((MyTiddler)(MyTemplate))
((MyTiddler)Template <<view text>>)
(((My filter expression)))
(((My filter expression))(MyTemplate))
(((My filter expression))Template <<view text>>)
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "transclude";

exports.runParser = true;
exports.blockParser = true;

exports.regExpString = "\\(\\((?:(?:[^\\(\\)]+)|(?:\\([^\\(\\)]+\\)))\\)(?:\\([^\\)]+\\)|(?:[^\\)]+))?\\)";

exports.parse = function(match,isBlock) {
	var regExp = /\(\((?:([^\(\)]+)|(?:\(([^\(\)]+)\)))\)(?:\(([^\)]+)\)|([^\)]+))?\)((?:\r?\n)?)/mg;
	regExp.lastIndex = this.pos;
	match = regExp.exec(this.source);
	if(match && match.index === this.pos) {
		this.pos = match.index + match[0].length;
		var macro, params = {}, parseTree;
		// Check if it is a single tiddler
		if(match[1]) {
			macro = "tiddler";
			params.target = match[1];
		} else {
			// Else it is a filter
			macro = "list";
			params.filter = match[2];
		}
		if(match[3]) {
			params.template = match[3];
		}
		if(match[4]) {
			parseTree = this.wiki.parseText("text/vnd.tiddlywiki",match[4]).tree;
		}
		return [$tw.Tree.Macro(macro,{
			srcParams: params,
			wiki: this.wiki,
			content: parseTree
		})];
	}
	return [];
};

})();
