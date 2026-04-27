/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/shared.js
type: application/javascript
module-type: library
\*/

"use strict";

function convertNodes(builders, nodes) {
	if(nodes === undefined || nodes.length === 0) {
		return [];
	}

	let result = [];
	const nodesCopy = nodes.slice();
	while(nodesCopy.length > 0) {
		const node = nodesCopy.shift();
		const convertedNodes = convertANode(builders, node, { nodes: nodesCopy });
		result = result.concat(convertedNodes);
	}
	return result;
}

function restoreMetadata(node) {
	void node;
	return {};
}

function convertANode(builders, node, context) {
	const builder = builders[node.type];
	if(typeof builder === "function") {
		const convertedNode = builder(builders, node, context);
		const arrayOfNodes = Array.isArray(convertedNode) ? convertedNode : [convertedNode];
		return arrayOfNodes.map((child) => {
			const metadata = restoreMetadata(node);
			let result = {};
			for(const key in metadata) {
				if(metadata.hasOwnProperty(key)) {
					result[key] = metadata[key];
				}
			}
			for(const key in child) {
				if(child.hasOwnProperty(key)) {
					result[key] = child[key];
				}
			}
			return result;
		});
	}
	if(node.content && node.content.length > 0) {
		return convertNodes(builders, node.content);
	}
	if(node.text) {
		return [{ type: "text", text: node.text }];
	}
	return [];
}

exports.convertNodes = convertNodes;
exports.convertANode = convertANode;
