/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from-prosemirror.js
type: application/javascript
module-type: library

Get the Wiki AST from a Prosemirror AST

\*/

"use strict";

const builders = require("$:/plugins/tiddlywiki/prosemirror/ast/from/registry.js");
const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertNodes;

function wikiAstFromProseMirrorAst(input) {
	return convertNodes(builders, Array.isArray(input) ? input : [input]);
}

exports.from = wikiAstFromProseMirrorAst;
