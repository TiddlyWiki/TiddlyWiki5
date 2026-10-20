/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/definition-list.js
type: application/javascript
module-type: library
\*/

"use strict";

const shared = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js");
const factory = $tw.utils.wikitextParseTree;

function buildDefinitionList(context, node) {
	const items = [];
	factory.listItems(node).forEach((item) => {
		const kind = factory.kindOf(item.node);
		if(kind === "definitionTerm") {
			items.push(buildDefinitionTerm(context, item.node));
		} else if(kind === "definitionDescription") {
			items.push(buildDefinitionDescription(context, item.node));
		}
	});
	if(items.length === 0) {
		return shared.buildOpaqueFromNode(node, context);
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
