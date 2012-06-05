/*\
title: $:/core/modules/parsers/newwikitextparser/rules/dash.js
type: application/javascript
module-type: wikitextrule

Wiki text run rule for HTML entities

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "dash";

exports.runParser = true;

exports.regExpString = "-{2,3}(?=\\s)";

exports.parse = function(match,isBlock) {
	this.pos = match.index + match[0].length;
	match = /(-{2,3})/mg.exec(match[0]);
	var dash = match[0].length === 2 ? "&ndash;" : "&mdash;";
	return [$tw.Tree.Entity(dash)];
};

})();
