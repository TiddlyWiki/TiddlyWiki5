/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from-prosemirror.js
type: application/javascript
module-type: library

Get the Wiki AST from a Prosemirror AST

\*/

function doc(builder, node) {
	return convertNodes(builder, node.content);
}

function paragraph(builder, node) {
	return {
		type: "element",
		tag: "p",
		rule: "parseblock",
		children: convertNodes(builder, node.content)
	};
}

function text(builder, node) {
	return {
		type: "text",
		text: node.text
	}
}

function heading(builder, node) {
	return {
		type: "element",
		tag: "h" + node.attrs.level,
		rule: "heading",
		attributes: {
			// TODO: restore class if any
		},
		children: convertNodes(builder, node.content)
	};
}

function list(builder, node, context) {
	const listType = node.attrs && node.attrs.kind === "ordered" ? "ol" : "ul";
	
	// Prepare an array to store all list items
	let listItems = [];
	
	// Add content from current node to list items
	node.content?.forEach?.(item => {
		listItems.push({
			type: "element",
			tag: "li",
			children: convertANode(builder, item)
		});
	});
	
	// Check if there are adjacent lists of the same type
	while (context && context.nodes && context.nodes.length > 0) {
		const nextNode = context.nodes[0];
		
		// If next node is also a list of the same type
		if (nextNode.type === 'list' && 
			((node.attrs && node.attrs.kind) === (nextNode.attrs && nextNode.attrs.kind))) {
			
			// Remove and consume the next node
			const consumedNode = context.nodes.shift();
			
			// Merge its content into current list
			consumedNode.content?.forEach?.(item => {
				listItems.push({
					type: "element",
					tag: "li",
					children: convertANode(builder, item)
				});
			});
		} else {
			// If next node is not a list of the same type, stop merging
			break;
		}
	}
	
	return {
		type: "element",
		tag: listType,
		rule: "list",
		children: listItems
	};
}

/**
 * Key is `node.type`, value is node converter function.
 */
const builders = {
	doc,
	paragraph,
	text,
	heading,
	list,
};

function wikiAstFromProseMirrorAst(input) {
	return convertNodes(builders, Array.isArray(input) ? input : [input]);
}

exports.from = wikiAstFromProseMirrorAst;

function convertNodes(builders, nodes) {
	if (nodes === undefined || nodes.length === 0) {
		return [];
	}

	const result = [];
	const nodesCopy = [...nodes]; // Create a copy to avoid modifying the original array
	
	while (nodesCopy.length > 0) {
		const node = nodesCopy.shift(); // Get and remove the first node
		const convertedNodes = convertANode(builders, node, { nodes: nodesCopy });
		result.push(...convertedNodes);
	}
	
	return result;
}

function restoreMetadata(node) {
	// TODO: restore attributes, orderedAttributes, isBlock
	return {};
}
function convertANode(builders, node, context) {
	var builder = builders[node.type];
	if (typeof builder === 'function') {
		var convertedNode = builder(builders, node, context);
		var arrayOfNodes = (Array.isArray(convertedNode)
		? convertedNode : [convertedNode]);
		return arrayOfNodes.map((child) => ({ ...restoreMetadata(node), ...child }));
	}
	console.warn(`WikiAst get Unknown node type: ${JSON.stringify(node)}`);
	return [];
}
