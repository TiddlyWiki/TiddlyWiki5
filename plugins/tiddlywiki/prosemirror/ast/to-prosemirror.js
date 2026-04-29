/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js
type: application/javascript
module-type: library

Get the Prosemirror AST from a Wiki AST

\*/

"use strict";

const builders = require("$:/plugins/tiddlywiki/prosemirror/ast/to/registry.js");
const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js").convertNodes;

function wikiAstToProsemirrorAst(node, options) {
	const context = {};
	for(const key in builders) {
		if(builders.hasOwnProperty(key)) {
			context[key] = builders[key];
		}
	}
	if(options) {
		for(const key in options) {
			if(options.hasOwnProperty(key)) {
				context[key] = options[key];
			}
		}
	}
	context.level = 0;
	const result = convertNodes(context, Array.isArray(node) ? node : [node]);
	if(!result || result.length === 0) {
		return {
			type: "doc",
			content: [{ type: "paragraph" }]
		};
	}
	return {
		type: "doc",
		content: result
	};
}

exports.to = wikiAstToProsemirrorAst;
