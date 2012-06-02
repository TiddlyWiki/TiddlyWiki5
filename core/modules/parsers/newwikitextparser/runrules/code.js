/*\
title: $:/core/modules/parsers/newwikitextparser/runrules/code.js
type: application/javascript
module-type: wikitextrule

Wiki text run rule for code runs

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "code";

exports.runParser = true;

exports.regExpString = "\\{\\{\\{";

exports.parse = function(match,isBlock) {
	this.pos = match.index + match[0].length;
	return [$tw.Tree.Element("code",{},this.parseRun(/(\}\}\})/mg))];
};

})();
