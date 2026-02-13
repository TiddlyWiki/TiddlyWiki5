/*\
title: $:/plugins/tiddlywiki/markdown/md-to-tid/converters/rules/code-inline.js
type: application/javascript
module-type: mdast-to-wikiast-rule

Handler for markdown inline code tokens

\*/

"use strict";

exports.type = "code_inline";

exports.handler = function(token, context) {
	return {
		type: "element",
		tag: "code",
		orderedAttributes: [],
		children: [{
			type: "text",
			text: token.content
		}],
		rule: "codeinline"
	};
};
