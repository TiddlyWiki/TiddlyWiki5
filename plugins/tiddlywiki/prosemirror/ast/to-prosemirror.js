/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js
type: application/javascript
module-type: library

Get the Prosemirror AST from a Wiki AST

\*/

function buildParagraph(context, node) {
	return {
		type: "paragraph",
		content: convertNodes(context, node.children)
	};
}

function buildHeading(context, node, level) {
	return {
		type: "heading",
		attrs: { level: level },
		content: convertNodes(context, node.children)
	};
}

function buildUnorderedList(context, node) {
	// Prosemirror requires split all lists into separate lists with single items
	return node.children.map(item => {
		const newContext = {};
		for(const key in context) {
			if(context.hasOwnProperty(key)) {
				newContext[key] = context[key];
			}
		}
		newContext.level = context.level + 1;
		const processedItem = convertANode(newContext, item);
		return {
			type: "list",
			attrs: {
				kind: "bullet",
				order: null,
				checked: false,
				collapsed: false
			},
			content: processedItem
		};
	});
}

function buildOrderedList(context, node) {
	return node.children.map(item => {
		const newContext = {};
		for(const key in context) {
			if(context.hasOwnProperty(key)) {
				newContext[key] = context[key];
			}
		}
		newContext.level = context.level + 1;
		const processedItem = convertANode(newContext, item);
		return {
			type: "list",
			attrs: {
				kind: "ordered",
				order: null,
				checked: false,
				collapsed: false
			},
			content: processedItem
		};
	});
}


/**
 * Helper function to ensure text nodes in list items are wrapped in paragraphs
 * ProseMirror requires list items to contain block content, not bare text
 */
function wrapTextNodesInParagraphs(context, nodes) {
	if(!nodes || nodes.length === 0) {
		return [];
	}

	let result = [];
	let currentTextNodes = [];

	const flushTextNodes = () => {
		if(currentTextNodes.length > 0) {
			result.push({
				type: "paragraph",
				content: currentTextNodes
			});
			currentTextNodes = [];
		}
	};

	nodes.forEach(node => {
		// If it's a text node, collect it
		if(node.type === "text") {
			currentTextNodes.push(node);
		} else {
			// If we encounter a non-text node, flush any collected text nodes
			flushTextNodes();
			// Add the non-text node as is
			result.push(node);
		}
	});

	// Flush any remaining text nodes
	flushTextNodes();

	return result;
}

function buildListItem(context, node) {
	const newContext = {};
	for(const key in context) {
		if(context.hasOwnProperty(key)) {
			newContext[key] = context[key];
		}
	}
	newContext.level = context.level + 1;
	const processedContent = convertNodes(newContext, node.children);
	// Ensure content starts with a block element (typically paragraph)
	return wrapTextNodesInParagraphs(context, processedContent);
}

function buildTextWithMark(context, node, markType) {
	const content = convertNodes(context, node.children);
	return content.map(childNode => {
		if(childNode.type === "text") {
			// Add the mark to the text node
			const marks = childNode.marks || [];
			const newMarks = marks.slice();
			newMarks.push({ type: markType });
			const result = {};
			for(const key in childNode) {
				if(childNode.hasOwnProperty(key)) {
					result[key] = childNode[key];
				}
			}
			result.marks = newMarks;
			return result;
		}
		return childNode;
	});
}

function buildStrong(context, node) {
	return buildTextWithMark(context, node, "strong");
}

function buildEm(context, node) {
	return buildTextWithMark(context, node, "em");
}

function buildCode(context, node) {
	return buildTextWithMark(context, node, "code");
}

function buildUnderline(context, node) {
	return buildTextWithMark(context, node, "underline");
}

function buildStrike(context, node) {
	return buildTextWithMark(context, node, "strike");
}

function buildSup(context, node) {
	return buildTextWithMark(context, node, "superscript");
}

function buildSub(context, node) {
	return buildTextWithMark(context, node, "subscript");
}

function buildCodeBlock(context, node) {
	// Extract text content from the code element inside pre
	let codeElement = null;
	if(node.children && node.children.length > 0) {
		for(let i = 0; i < node.children.length; i++) {
			if(node.children[i].tag === "code") {
				codeElement = node.children[i];
				break;
			}
		}
	}
	if(codeElement && codeElement.children) {
		let textContent = "";
		for(let j = 0; j < codeElement.children.length; j++) {
			if(codeElement.children[j].type === "text") {
				textContent += codeElement.children[j].text;
			}
		}
		return {
			type: "code_block",
			content: [{
				type: "text",
				text: textContent
			}]
		};
	}
	// Fallback: extract all text from children
	let fallbackText = "";
	if(node.children) {
		for(let k = 0; k < node.children.length; k++) {
			if(node.children[k].type === "text") {
				fallbackText += node.children[k].text;
			}
		}
	}
	return {
		type: "code_block",
		content: [{
			type: "text",
			text: fallbackText
		}]
	};
}

/**
 * Many node shares same type `element` in wikiAst, we need to distinguish them by tag.
 */
const elementBuilders = {
	p: buildParagraph,
	h1: (context, node) => buildHeading(context, node, 1),
	h2: (context, node) => buildHeading(context, node, 2),
	h3: (context, node) => buildHeading(context, node, 3),
	h4: (context, node) => buildHeading(context, node, 4),
	h5: (context, node) => buildHeading(context, node, 5),
	h6: (context, node) => buildHeading(context, node, 6),
	ul: buildUnorderedList,
	ol: buildOrderedList,
	li: buildListItem,
	strong: buildStrong,
	em: buildEm,
	code: buildCode,
	u: buildUnderline,
	strike: buildStrike,
	sup: buildSup,
	sub: buildSub,
	pre: buildCodeBlock
};

function element(context, node) {
	const builder = elementBuilders[node.tag];
	if(builder) {
		return builder(context, node);
	} else {
		console.warn("Unknown element tag: " + node.tag);
		return [];
	}
}

function text(context, node) {
	return {
		type: "text",
		text: node.text
	};
}

function codeblock(context, node) {
	// Extract code and language from attributes
	const code = node.attributes && node.attributes.code ? node.attributes.code.value : "";
	const language = node.attributes && node.attributes.language ? node.attributes.language.value : "";
	
	return {
		type: "code_block",
		attrs: language ? { language: language } : {},
		content: [{
			type: "text",
			text: code
		}]
	};
}

function image(context, node) {
	const getImageAttrsFromWikiAstImageNode = require("$:/plugins/tiddlywiki/prosemirror/image/utils.js").getImageAttrsFromWikiAstImageNode;
	return {
		type: "image",
		attrs: getImageAttrsFromWikiAstImageNode(node)
	};
}

/**
 * Handle transclude nodes (widgets, macros, procedures)
 * Convert them to paragraphs with the original widget syntax
 */
function transclude(context, node) {
	// Reconstruct the widget call syntax from the transclude node
	let widgetText = "<<";
	
	// Get the widget/macro/procedure name
	const widgetName = node.attributes && node.attributes.$variable 
		? node.attributes.$variable.value 
		: "unknown";
	
	widgetText += widgetName;
	
	// Add ordered attributes (excluding $variable)
	if(node.orderedAttributes) {
		for(let i = 0; i < node.orderedAttributes.length; i++) {
			const attr = node.orderedAttributes[i];
			if(attr.name !== "$variable") {
				widgetText += " ";
				// For positional parameters, just add the value
				if(attr.name.match(/^\d+$/)) {
					widgetText += '"' + attr.value + '"';
				} else {
					// For named parameters, add name=value
					widgetText += attr.name + '="' + attr.value + '"';
				}
			}
		}
	}
	
	widgetText += ">>";
	
	// Return as a paragraph with the widget text
	return {
		type: "paragraph",
		content: [{
			type: "text",
			text: widgetText
		}]
	};
}

/**
 * Key is wikiAst node type, value is node converter function.
 */
const builders = {
	element: element,
	text: text,
	codeblock: codeblock,
	image: image,
	transclude: transclude
};

function wikiAstToProsemirrorAst(node, options) {
	// Initialize context with level tracking
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
	// ProseMirror's basic schema requires doc.content to be block+.
	// Ensure we always return at least one empty paragraph for empty source.
	if(!result || result.length === 0) {
		return {
			type: "doc",
			content: [{ type: "paragraph" }]
		};
	}
	
	// Wrap in a doc if needed
	if(result.length > 0 && result[0].type !== "doc") {
		return {
			type: "doc",
			content: result
		};
	}
	
	return result;
}

exports.to = wikiAstToProsemirrorAst;

function convertNodes(context, nodes) {
	if(nodes === undefined || nodes.length === 0) {
		return [];
	}

	return nodes.reduce((accumulator, node) => {
		const convertedNodes = convertANode(context, node);
		return accumulator.concat(convertedNodes);
	}, []);
}

function convertANode(context, node) {
	const builder = context[node.type];
	if(typeof builder === "function") {
		const convertedNode = builder(context, node);
		const arrayOfNodes = (Array.isArray(convertedNode)
		? convertedNode : [convertedNode]);
		return arrayOfNodes;
	}
	console.warn("ProseMirror get Unknown node type: " + JSON.stringify(node));
	return [];
}
