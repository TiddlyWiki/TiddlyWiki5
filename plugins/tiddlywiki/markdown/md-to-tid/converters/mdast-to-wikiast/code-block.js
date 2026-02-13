/*\
title: $:/plugins/tiddlywiki/markdown/md-to-tid/converters/rules/code-block.js
type: application/javascript
module-type: mdast-to-wikiast-rule

Handler for markdown code block tokens

\*/

"use strict";

exports.code_block = {
	type: "code_block",
	isBlock: true,
	handler: function(token, context) {
		return {
			type: "codeblock",
			attributes: {
				language: {
					type: "string",
					value: ""
				},
				code: {
					type: "string",
					value: token.content
				}
			},
			rule: "codeblock"
		};
	}
};

exports.fence = {
	type: "fence",
	isBlock: true,
	handler: function(token, context) {
		var content = token.content || "";
		if(content.endsWith("\n")) {
			content = content.slice(0, -1);
		}
		return {
			type: "codeblock",
			attributes: {
				language: {
					type: "string",
					value: token.info || ""
				},
				code: {
					type: "string",
					value: content
				}
			},
			rule: "codeblock"
		};
	}
};
