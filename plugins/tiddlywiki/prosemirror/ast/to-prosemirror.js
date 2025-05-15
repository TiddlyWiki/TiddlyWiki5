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
		const processedItem = convertANode({...context, level: context.level + 1}, item);
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
		const processedItem = convertANode({...context, level: context.level + 1}, item);
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
	if (!nodes || nodes.length === 0) {
		return [];
	}

	const result = [];
	let currentTextNodes = [];

	function flushTextNodes() {
		if (currentTextNodes.length > 0) {
			result.push({
				type: "paragraph",
				content: currentTextNodes
			});
			currentTextNodes = [];
		}
	}

	nodes.forEach(node => {
		// If it's a text node, collect it
		if (node.type === "text") {
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
	const processedContent = convertNodes({...context, level: context.level + 1}, node.children);
	// Ensure content starts with a block element (typically paragraph)
	return wrapTextNodesInParagraphs(context, processedContent);
}

function buildTextWithMark(context, node, markType) {
	const content = convertNodes(context, node.children);
	return content.map(childNode => {
		if (childNode.type === "text") {
			// Add the mark to the text node
			const marks = childNode.marks || [];
			return {
				...childNode,
				marks: [...marks, { type: markType }]
			};
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
	sub: buildSub
};

function element(context, node) {
	const builder = elementBuilders[node.tag];
	if (builder) {
		return builder(context, node);
	} else {
		console.warn(`Unknown element tag: ${node.tag}`);
		return [];
	}
}

function text(context, node) {
	return {
		type: "text",
		text: node.text
	};
}

/**
 * Key is wikiAst node type, value is node converter function.
 */
const builders = {
	element,
	text
};

function wikiAstToProsemirrorAst(node, options) {
	// Initialize context with level tracking
	const context = { ...builders, ...options, level: 0 };
	const result = convertNodes(context, Array.isArray(node) ? node : [node]);
	
	// Wrap in a doc if needed
	if (result.length > 0 && result[0].type !== "doc") {
		return {
			type: "doc",
			content: result
		};
	}
	
	return result;
}

exports.to = wikiAstToProsemirrorAst;

function convertNodes(context, nodes) {
	if (nodes === undefined || nodes.length === 0) {
		return [];
	}

	return nodes.reduce((accumulator, node) => {
		return [...accumulator, ...convertANode(context, node)];
	}, []);
}

function convertANode(context, node) {
	var builder = context[node.type];
	if (typeof builder === 'function') {
		var convertedNode = builder(context, node);
		var arrayOfNodes = (Array.isArray(convertedNode)
		? convertedNode : [convertedNode]);
		return arrayOfNodes;
	}
	console.warn(`ProseMirror get Unknown node type: ${JSON.stringify(node)}`);
	return [];
}
