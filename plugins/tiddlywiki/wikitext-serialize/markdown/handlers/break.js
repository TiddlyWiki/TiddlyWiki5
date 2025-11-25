/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/markdown/handlers/break.js
type: application/javascript
module-type: markdown-to-wikiast-handler

Handler for markdown break tokens

\*/

"use strict";

// Export multiple handlers from this module
exports.hardbreak = {
	type: "hardbreak",
	handler: function(token, context) {
		return {
			type: "element",
			tag: "br",
			isSelfClosing: false,
			isBlock: false,
			orderedAttributes: [],
			rule: "html"
		};
	}
};

exports.softbreak = {
	type: "softbreak",
	handler: function(token, context) {
		return {
			type: "text",
			text: "\n"
		};
	}
};
