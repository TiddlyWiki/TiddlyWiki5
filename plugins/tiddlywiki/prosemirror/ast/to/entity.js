/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/entity.js
type: application/javascript
module-type: library
\*/

"use strict";

module.exports = function entity(context, node) {
	const entityStr = node.entity || "";
	const entityMap = {
		"&ndash;": "\u2013",
		"&mdash;": "\u2014",
		"&amp;": "&",
		"&lt;": "<",
		"&gt;": ">",
		"&quot;": '"',
		"&apos;": "'",
		"&nbsp;": "\u00A0",
		"&laquo;": "\u00AB",
		"&raquo;": "\u00BB",
		"&hellip;": "\u2026",
		"&copy;": "\u00A9",
		"&reg;": "\u00AE",
		"&trade;": "\u2122",
		"&times;": "\u00D7",
		"&divide;": "\u00F7"
	};
	let decoded = entityMap[entityStr];
	if(decoded === undefined) {
		const numMatch = entityStr.match(/^&#(x?)([0-9a-fA-F]+);$/);
		if(numMatch) {
			const codePoint = parseInt(numMatch[2], numMatch[1] ? 16 : 10);
			if(codePoint > 0 && codePoint <= 0x10FFFF) {
				decoded = String.fromCodePoint(codePoint);
			}
		}
	}
	return {
		type: "text",
		text: decoded !== undefined ? decoded : entityStr
	};
};
