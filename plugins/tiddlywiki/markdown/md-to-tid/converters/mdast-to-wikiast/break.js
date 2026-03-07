/*\
title: $:/plugins/tiddlywiki/markdown/md-to-tid/converters/rules/break.js
type: application/javascript
module-type: mdast-to-wikiast-rule

Handler for markdown break tokens

\*/

"use strict";

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
