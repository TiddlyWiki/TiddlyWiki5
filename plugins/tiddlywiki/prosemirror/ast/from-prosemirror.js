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

// Map ProseMirror mark types to HTML tags
var markTypeMap = {
	strong: "strong",
	em: "em"
};
var markRuleMap = {
	em: "italic",
	strong: "bold"
};
// Define mark priority (inner to outer)
var markPriority = ["code", "strong", "bold", "em", "italic", "underline", "strike", "strikethrough", "superscript", "subscript"];
function text(builder, node) {
	if(!node.text) {
		return {
			type: "text",
			text: ""
		};
	}
	if(node.marks && node.marks.length > 0) {
		// Create base text node
		var textNode = {
			type: "text",
			text: node.text
		};
		var sortedMarks = node.marks.slice().sort(function(a, b) {
			var indexA = markPriority.indexOf(a.type);
			var indexB = markPriority.indexOf(b.type);
			// Place unknown mark types at the end
			if(indexA === -1) return 1;
			if(indexB === -1) return -1;
			return indexA - indexB;
		});
		
		// Apply marks from inner to outer
		return sortedMarks.reduce(function(wrappedNode, mark) {
			var tag = markTypeMap[mark.type];
			var rule = markRuleMap[mark.type];
			return {
				type: "element",
				tag: tag,
				rule: rule,
				children: [wrappedNode]
			};
		}, textNode);
	}
	return {
		type: "text",
		text: node.text
	};
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
	var listType = node.attrs && node.attrs.kind === "ordered" ? "ol" : "ul";
	
	// Prepare an array to store all list items
	var listItems = [];
	
	// Add content from current node to list items
	if(node.content && node.content.forEach) {
		node.content.forEach(function(item) {
			listItems.push({
				type: "element",
				tag: "li",
				children: convertANode(builder, item)
			});
		});
	}
	
	// Check if there are adjacent lists of the same type
	while(context && context.nodes && context.nodes.length > 0) {
		var nextNode = context.nodes[0];
		
		// If next node is also a list of the same type
		if(nextNode.type === "list" && 
			((node.attrs && node.attrs.kind) === (nextNode.attrs && nextNode.attrs.kind))) {
			
			// Remove and consume the next node
			var consumedNode = context.nodes.shift();
			
			// Merge its content into current list
			if(consumedNode.content && consumedNode.content.forEach) {
				consumedNode.content.forEach(function(item) {
					listItems.push({
						type: "element",
						tag: "li",
						children: convertANode(builder, item)
					});
				});
			}
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

function code_block(builder, node) {
	// Extract text content from the node
	var textContent = "";
	if(node.content && node.content.length > 0) {
		textContent = node.content.map(function(child) {
			return child.text || "";
		}).join("");
	}
	
	// Get language from node attributes if available, default to empty string
	var language = (node.attrs && node.attrs.language) || "";
	
	return {
		type: "codeblock",
		rule: "codeblock",
		attributes: {
			code: {
				type: "string", 
				value: textContent
			},
			language: {
				type: "string", 
				value: language
			}
		}
	};
}

/**
 * Key is `node.type`, value is node converter function.
 */
var builders = {
	doc: doc,
	paragraph: paragraph,
	text: text,
	heading: heading,
	list: list,
	code_block: code_block
};

function wikiAstFromProseMirrorAst(input) {
	return convertNodes(builders, Array.isArray(input) ? input : [input]);
}

exports.from = wikiAstFromProseMirrorAst;

function convertNodes(builders, nodes) {
	if(nodes === undefined || nodes.length === 0) {
		return [];
	}

	var result = [];
	var nodesCopy = nodes.slice(); // Create a copy to avoid modifying the original array
	
	while(nodesCopy.length > 0) {
		var node = nodesCopy.shift(); // Get and remove the first node
		var convertedNodes = convertANode(builders, node, { nodes: nodesCopy });
		result = result.concat(convertedNodes);
	}
	
	return result;
}

function restoreMetadata(node) {
	// TODO: restore attributes, orderedAttributes, isBlock
	return {};
}
function convertANode(builders, node, context) {
	var builder = builders[node.type];
	if(typeof builder === "function") {
		var convertedNode = builder(builders, node, context);
		var arrayOfNodes = (Array.isArray(convertedNode)
		? convertedNode : [convertedNode]);
		return arrayOfNodes.map(function(child) {
			var metadata = restoreMetadata(node);
			var result = {};
			// Manual object merge instead of spread operator
			for(var key in metadata) {
				if(metadata.hasOwnProperty(key)) {
					result[key] = metadata[key];
				}
			}
			for(var key in child) {
				if(child.hasOwnProperty(key)) {
					result[key] = child[key];
				}
			}
			return result;
		});
	}
	console.warn("WikiAst get Unknown node type: " + JSON.stringify(node));
	return [];
}
