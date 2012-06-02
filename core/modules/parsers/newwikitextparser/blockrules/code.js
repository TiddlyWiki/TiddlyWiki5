/*\
title: $:/core/modules/parsers/newwikitextparser/blockrules/code.js
type: application/javascript
module-type: wikitextrule

Wiki text run rule for code blocks

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "code";

exports.blockParser = true;

exports.regExpString = "\\{\\{\\{\\s*\\r?\\n";

exports.parse = function(match,isBlock) {
	this.pos = match.index + match[0].length;
	return [$tw.Tree.Element("pre",{},this.parseRun(/(\}\}\})/mg))];
};

})();
