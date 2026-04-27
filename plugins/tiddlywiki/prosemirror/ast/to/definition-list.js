/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/definition-list.js
type: application/javascript
module-type: library
\*/

"use strict";

const shared = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js");

function buildDefinitionList(context, node) {
	const items = [];
	const children = node.children || [];
	for(let i = 0; i < children.length; i++) {
		const child = children[i];
		if(child.type === "element" && child.tag === "dt") {
			items.push(buildDefinitionTerm(context, child));
		} else if(child.type === "element" && child.tag === "dd") {
			items.push(buildDefinitionDescription(context, child));
		}
	}
	if(items.length === 0) {
		return shared.buildOpaqueFromNode(node);
	}
	return {
		type: "definition_list",
		content: items
	};
}

function buildDefinitionTerm(context, node) {
	return {
		type: "definition_term",
		content: shared.convertNodes(context, node.children)
	};
}

function buildDefinitionDescription(context, node) {
	return {
		type: "definition_description",
		content: shared.convertNodes(context, node.children)
	};
}

exports.buildDefinitionList = buildDefinitionList;
exports.buildDefinitionTerm = buildDefinitionTerm;
exports.buildDefinitionDescription = buildDefinitionDescription;
