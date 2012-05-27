/*\
title: $:/core/modules/parsers/newwikitextparser/blockrules/heading.js
type: application/javascript
module-type: wikitextrule

Wiki text block rule for headings

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "heading";

exports.blockParser = true;

exports.regExpString = "!{1,6}";

exports.parse = function(match) {
	this.pos = match.index + match[0].length;
	var classedRun = this.parseClassedRun(/(\r?\n)/mg);
	return [$tw.Tree.Element("h1",{"class": classedRun["class"]},classedRun.tree)];
};

})();
