/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/definition-list.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/from/shared.js").convertNodes;

function definitionList(builders, node) {
	return {
		type: "element",
		tag: "dl",
		children: convertNodes(builders, node.content)
	};
}

function definitionTerm(builders, node) {
	return {
		type: "element",
		tag: "dt",
		children: convertNodes(builders, node.content)
	};
}

function definitionDescription(builders, node) {
	return {
		type: "element",
		tag: "dd",
		children: convertNodes(builders, node.content)
	};
}

exports.definitionList = definitionList;
exports.definitionTerm = definitionTerm;
exports.definitionDescription = definitionDescription;
