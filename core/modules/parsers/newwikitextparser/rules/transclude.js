/*\
title: $:/core/modules/parsers/newwikitextparser/rules/transclude.js
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
		var macro, params = {};
		// Check if it is a single tiddler
		if(match[1]) {
			macro = "tiddler";
			params.target = match[1];
		} else {
			// Else it is a filter
			macro = "transclude";
			params.filter = match[2];
		}
		if(match[3]) {
			params.template = match[3];
		}
		if(match[4]) {
			params.templateText = match[4];
		}
		return [$tw.Tree.Macro(macro,{
			srcParams: params,
			wiki: this.wiki
		})];
	}
	return [];
};

})();
