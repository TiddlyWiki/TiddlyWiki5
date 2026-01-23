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
	// Check if this paragraph contains a widget call
	// If it's a single text node that looks like <<widgetName ...>>
	if(node.content && node.content.length === 1 && node.content[0].type === "text") {
		const text = node.content[0].text.trim();
		const widgetPattern = /^<<\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*(.*)>>$/;
		const match = text.match(widgetPattern);
		
		if(match) {
			const widgetName = match[1];
			const attributesStr = match[2].trim();
			
			// Parse attributes
			const attributes = { $variable: { name: "$variable", type: "string", value: widgetName } };
			const orderedAttributes = [{ name: "$variable", type: "string", value: widgetName }];
			
			// Simple attribute parsing - handle quoted strings
			const attrPattern = /(?:([a-zA-Z_][a-zA-Z0-9_-]*)=)?(?:"([^"]*)"|'([^']*)'|([^\s]+))/g;
			let attrMatch;
			let paramIndex = 0;
			
			while((attrMatch = attrPattern.exec(attributesStr)) !== null) {
				const key = attrMatch[1];
				const value = attrMatch[2] || attrMatch[3] || attrMatch[4];
				
				if(key) {
					attributes[key] = { name: key, type: "string", value: value };
					orderedAttributes.push({ name: key, type: "string", value: value });
				} else {
					// Positional argument
					const paramName = String(paramIndex);
					attributes[paramName] = { name: paramName, type: "string", value: value };
					orderedAttributes.push({ name: paramName, type: "string", value: value });
					paramIndex++;
				}
			}
			
			// Return a transclude node
			return {
				type: "transclude",
				attributes: attributes,
				orderedAttributes: orderedAttributes,
				isBlock: true,
				rule: "macrocallblock"
			};
		}
	}
	
	// Normal paragraph
	return {
		type: "element",
		tag: "p",
		rule: "parseblock",
		children: convertNodes(builder, node.content)
	};
}

// Map ProseMirror mark types to HTML tags
const markTypeMap = {
	strong: "strong",
	em: "em"
};
const markRuleMap = {
	em: "italic",
	strong: "bold"
};
// Define mark priority (inner to outer)
const markPriority = ["code", "strong", "bold", "em", "italic", "underline", "strike", "strikethrough", "superscript", "subscript"];
function text(builder, node) {
	if(!node.text) {
		return {
			type: "text",
			text: ""
		};
	}
	if(node.marks && node.marks.length > 0) {
		// Create base text node
		const textNode = {
			type: "text",
			text: node.text
		};
		const sortedMarks = node.marks.slice().sort((a, b) => {
			const indexA = markPriority.indexOf(a.type);
			const indexB = markPriority.indexOf(b.type);
			// Place unknown mark types at the end
			if(indexA === -1) return 1;
			if(indexB === -1) return -1;
			return indexA - indexB;
		});
		
		// Apply marks from inner to outer
		return sortedMarks.reduce((wrappedNode, mark) => {
			const tag = markTypeMap[mark.type];
			const rule = markRuleMap[mark.type];
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
	const listType = node.attrs && node.attrs.kind === "ordered" ? "ol" : "ul";
	
	// Prepare an array to store all list items
	let listItems = [];
	
	// Add content from current node to list items
	if(node.content && node.content.forEach) {
		node.content.forEach(item => {
			listItems.push({
				type: "element",
				tag: "li",
				children: convertANode(builder, item)
			});
		});
	}
	
	// Check if there are adjacent lists of the same type
	while(context && context.nodes && context.nodes.length > 0) {
		const nextNode = context.nodes[0];
		
		// If next node is also a list of the same type
		if(nextNode.type === "list" && 
			((node.attrs && node.attrs.kind) === (nextNode.attrs && nextNode.attrs.kind))) {
			
			// Remove and consume the next node
			const consumedNode = context.nodes.shift();
			
			// Merge its content into current list
			if(consumedNode.content && consumedNode.content.forEach) {
				consumedNode.content.forEach(item => {
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
	let textContent = "";
	if(node.content && node.content.length > 0) {
		textContent = node.content.map(child => child.text || "").join("");
	}
	
	// Get language from node attributes if available, default to empty string
	const language = (node.attrs && node.attrs.language) || "";
	
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

function image(builder, node) {
	const attrs = (node && node.attrs) || {};
	const source = (attrs.twSource || attrs.src || "").toString();
	const kind = (attrs.twKind || "shortcut").toString();
	if(kind === "widget") {
		const widgetAttrs = {
			source: {
				name: "source",
				type: "string",
				value: source
			}
		};
		const orderedAttrs = [
			{
				name: "source",
				type: "string",
				value: source
			}
		];
		if(attrs.width) {
			widgetAttrs.width = {
				name: "width",
				type: "string",
				value: attrs.width.toString()
			};
			orderedAttrs.push({
				name: "width",
				type: "string",
				value: attrs.width.toString()
			});
		}
		if(attrs.height) {
			widgetAttrs.height = {
				name: "height",
				type: "string",
				value: attrs.height.toString()
			};
			orderedAttrs.push({
				name: "height",
				type: "string",
				value: attrs.height.toString()
			});
		}
		if(attrs.twTooltip) {
			widgetAttrs.tooltip = {
				name: "tooltip",
				type: "string",
				value: attrs.twTooltip.toString()
			};
			orderedAttrs.push({
				name: "tooltip",
				type: "string",
				value: attrs.twTooltip.toString()
			});
		}
		return {
			type: "image",
			tag: "$image",
			isSelfClosing: true,
			isBlock: false,
			rule: "html",
			attributes: widgetAttrs,
			orderedAttributes: orderedAttrs
		};
	}
	// Default: image shortcut syntax [img[...]]
	const attributes = {
		source: {
			name: "source",
			type: "string",
			value: source
		}
	};
	if(attrs.width) {
		attributes.width = {
			name: "width",
			type: "string",
			value: attrs.width.toString()
		};
	}
	if(attrs.height) {
		attributes.height = {
			name: "height",
			type: "string",
			value: attrs.height.toString()
		};
	}
	if(attrs.twTooltip) {
		attributes.tooltip = {
			name: "tooltip",
			type: "string",
			value: attrs.twTooltip.toString()
		};
	}
	return {
		type: "image",
		rule: "image",
		attributes: attributes
	};
}

/**
 * Key is `node.type`, value is node converter function.
 */
const builders = {
	doc: doc,
	paragraph: paragraph,
	text: text,
	heading: heading,
	list: list,
	code_block: code_block,
	image: image
};

function wikiAstFromProseMirrorAst(input) {
	return convertNodes(builders, Array.isArray(input) ? input : [input]);
}

exports.from = wikiAstFromProseMirrorAst;

function convertNodes(builders, nodes) {
	if(nodes === undefined || nodes.length === 0) {
		return [];
	}

	let result = [];
	const nodesCopy = nodes.slice(); // Create a copy to avoid modifying the original array
	
	while(nodesCopy.length > 0) {
		const node = nodesCopy.shift(); // Get and remove the first node
		const convertedNodes = convertANode(builders, node, { nodes: nodesCopy });
		result = result.concat(convertedNodes);
	}
	
	return result;
}

function restoreMetadata(node) {
	// TODO: restore attributes, orderedAttributes, isBlock
	return {};
}
function convertANode(builders, node, context) {
	const builder = builders[node.type];
	if(typeof builder === "function") {
		const convertedNode = builder(builders, node, context);
		const arrayOfNodes = (Array.isArray(convertedNode)
		? convertedNode : [convertedNode]);
		return arrayOfNodes.map(child => {
			const metadata = restoreMetadata(node);
			const result = {};
			// Manual object merge instead of spread operator
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
	console.warn("WikiAst get Unknown node type: " + JSON.stringify(node));
	return [];
}
