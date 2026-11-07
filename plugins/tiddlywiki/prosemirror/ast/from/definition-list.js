/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/definition-list.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertNodes;
const factory = $tw.utils.wikitextParseTree;

function definitionList(builders, node) {
	return factory.definitionList(convertNodes(builders, node.content));
}

function definitionTerm(builders, node) {
	return factory.definitionTerm(convertNodes(builders, node.content));
}

function definitionDescription(builders, node) {
	return factory.definitionDescription(convertNodes(builders, node.content));
}

exports.definitionList = definitionList;
exports.definitionTerm = definitionTerm;
exports.definitionDescription = definitionDescription;
