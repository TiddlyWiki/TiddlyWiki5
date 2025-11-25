/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/markdown/rules/hr.js
type: application/javascript
module-type: markdown-to-wikiast-handler

Handler for markdown horizontal rule tokens

\*/

"use strict";

exports.type = "hr";
exports.isBlock = true;

exports.handler = function(token, context) {
	return {
		type: "element",
		tag: "hr",
		orderedAttributes: [],
		rule: "horizrule"
	};
};
