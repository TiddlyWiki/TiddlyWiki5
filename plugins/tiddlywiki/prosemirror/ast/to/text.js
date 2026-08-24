/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/text.js
type: application/javascript
module-type: library
\*/

"use strict";

module.exports = function text(context, node) {
	return {
		type: "text",
		text: node.text
	};
};
