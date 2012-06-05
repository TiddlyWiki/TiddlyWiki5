/*\
title: $:/core/modules/parsers/newwikitextparser/rules/entity.js
type: application/javascript
module-type: wikitextrule

Wiki text run rule for HTML entities

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "entity";

exports.runParser = true;

exports.regExpString = "&#?[a-zA-Z0-9]{2,8};";

exports.parse = function(match,isBlock) {
	this.pos = match.index + match[0].length;
	return [$tw.Tree.Entity(match[0])];
};

})();
