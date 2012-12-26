/*\
title: $:/core/modules/parsers/wikitextparser/rules/comment.js
type: application/javascript
module-type: wikitextrule

Wiki text run rule for HTML comments. For example:

{{{
<!-- This is a comment -->
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "comment";

exports.blockParser = true;
exports.runParser = true;

// Regexp by Stephen Ostermiller, http://ostermiller.org/findhtmlcomment.html

exports.regExpString = "\\<![ \\r\\n\\t]*(?:--(?:[^\\-]|[\\r\\n]|-[^\\-])*--[ \\r\\n\\t]*)\\>";

exports.parse = function(match,isBlock) {
	this.pos = match.index + match[0].length;
	return this.parseBlock();
};

})();
