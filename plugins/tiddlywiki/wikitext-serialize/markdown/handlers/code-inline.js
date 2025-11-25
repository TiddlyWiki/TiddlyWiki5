/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/markdown/handlers/code-inline.js
type: application/javascript
module-type: markdown-to-wikiast-handler

Handler for markdown inline code tokens

\*/

"use strict";

exports.type = "code_inline";

exports.handler = function(token, context) {
	return {
		type: "element",
		tag: "code",
		children: [{
			type: "text",
			text: token.content
		}],
		rule: "codeinline"
	};
};
