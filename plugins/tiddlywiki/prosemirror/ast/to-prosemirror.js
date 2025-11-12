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
	return node.children.map(function(item) {
		var newContext = {};
		for(var key in context) {
			if(context.hasOwnProperty(key)) {
				newContext[key] = context[key];
			}
		}
		newContext.level = context.level + 1;
		var processedItem = convertANode(newContext, item);
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
	return node.children.map(function(item) {
		var newContext = {};
		for(var key in context) {
			if(context.hasOwnProperty(key)) {
				newContext[key] = context[key];
			}
		}
		newContext.level = context.level + 1;
		var processedItem = convertANode(newContext, item);
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

	var result = [];
	var currentTextNodes = [];

	function flushTextNodes() {
		if(currentTextNodes.length > 0) {
			result.push({
				type: "paragraph",
				content: currentTextNodes
			});
			currentTextNodes = [];
		}
	}

	nodes.forEach(function(node) {
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
	var newContext = {};
	for(var key in context) {
		if(context.hasOwnProperty(key)) {
			newContext[key] = context[key];
		}
	}
	newContext.level = context.level + 1;
	var processedContent = convertNodes(newContext, node.children);
	// Ensure content starts with a block element (typically paragraph)
	return wrapTextNodesInParagraphs(context, processedContent);
}

function buildTextWithMark(context, node, markType) {
	var content = convertNodes(context, node.children);
	return content.map(function(childNode) {
		if(childNode.type === "text") {
			// Add the mark to the text node
			var marks = childNode.marks || [];
			var newMarks = marks.slice();
			newMarks.push({ type: markType });
			var result = {};
			for(var key in childNode) {
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
	var codeElement = null;
	if(node.children && node.children.length > 0) {
		for(var i = 0; i < node.children.length; i++) {
			if(node.children[i].tag === "code") {
				codeElement = node.children[i];
				break;
			}
		}
	}
	if(codeElement && codeElement.children) {
		var textContent = "";
		for(var j = 0; j < codeElement.children.length; j++) {
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
	var fallbackText = "";
	if(node.children) {
		for(var k = 0; k < node.children.length; k++) {
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
var elementBuilders = {
	p: buildParagraph,
	h1: function(context, node) { return buildHeading(context, node, 1); },
	h2: function(context, node) { return buildHeading(context, node, 2); },
	h3: function(context, node) { return buildHeading(context, node, 3); },
	h4: function(context, node) { return buildHeading(context, node, 4); },
	h5: function(context, node) { return buildHeading(context, node, 5); },
	h6: function(context, node) { return buildHeading(context, node, 6); },
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
	var builder = elementBuilders[node.tag];
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
	var code = node.attributes && node.attributes.code ? node.attributes.code.value : "";
	var language = node.attributes && node.attributes.language ? node.attributes.language.value : "";
	
	return {
		type: "code_block",
		attrs: language ? { language: language } : {},
		content: [{
			type: "text",
			text: code
		}]
	};
}

/**
 * Key is wikiAst node type, value is node converter function.
 */
var builders = {
	element: element,
	text: text,
	codeblock: codeblock
};

function wikiAstToProsemirrorAst(node, options) {
	// Initialize context with level tracking
	var context = {};
	for(var key in builders) {
		if(builders.hasOwnProperty(key)) {
			context[key] = builders[key];
		}
	}
	if(options) {
		for(var key in options) {
			if(options.hasOwnProperty(key)) {
				context[key] = options[key];
			}
		}
	}
	context.level = 0;
	var result = convertNodes(context, Array.isArray(node) ? node : [node]);
	
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

	return nodes.reduce(function(accumulator, node) {
		var convertedNodes = convertANode(context, node);
		return accumulator.concat(convertedNodes);
	}, []);
}

function convertANode(context, node) {
	var builder = context[node.type];
	if(typeof builder === "function") {
		var convertedNode = builder(context, node);
		var arrayOfNodes = (Array.isArray(convertedNode)
		? convertedNode : [convertedNode]);
		return arrayOfNodes;
	}
	console.warn("ProseMirror get Unknown node type: " + JSON.stringify(node));
	return [];
}
