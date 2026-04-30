/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/shared.js
type: application/javascript
module-type: library
\*/

"use strict";

function childContext(context) {
	const newContext = {};
	for(const key in context) {
		if(context.hasOwnProperty(key)) {
			newContext[key] = context[key];
		}
	}
	newContext.level = context.level + 1;
	return newContext;
}

function wrapTextNodesInParagraphs(nodes) {
	if(!nodes || nodes.length === 0) {
		return [];
	}
	let result = [];
	let currentTextNodes = [];
	const flushTextNodes = () => {
		if(currentTextNodes.length > 0) {
			result.push({ type: "paragraph", content: currentTextNodes });
			currentTextNodes = [];
		}
	};
	nodes.forEach((node) => {
		if(node.type === "text") {
			currentTextNodes.push(node);
		} else {
			flushTextNodes();
			result.push(node);
		}
	});
	flushTextNodes();
	return result;
}

function buildTextWithMark(context, node, markType) {
	const content = convertNodes(context, node.children);
	return content.map((childNode) => {
		if(childNode.type === "text") {
			const newMarks = (childNode.marks || []).concat([{ type: markType }]);
			const result = Object.assign({}, childNode);
			result.marks = newMarks;
			return result;
		}
		return childNode;
	});
}

function extractPlainText(node) {
	if(!node) return "";
	if(node.type === "text") return node.text || "";
	let result = "";
	if(node.children) {
		for(let i = 0; i < node.children.length; i++) {
			result += extractPlainText(node.children[i]);
		}
	}
	return result;
}

function serializeNodeToRawText(node) {
	try {
		const tree = Array.isArray(node) ? node : [node];
		return $tw.utils.serializeWikitextParseTree(tree);
	} catch(e) {
		return JSON.stringify(node);
	}
}

function extractSourceText(node, context) {
	if(context && context.sourceText && typeof node.start === "number" && typeof node.end === "number") {
		const sourceText = context.sourceText;
		if(node.start >= 0 && node.end <= sourceText.length && node.start < node.end) {
			return sourceText.substring(node.start, node.end);
		}
	}
	return null;
}

function buildOpaqueFromNode(node, context) {
	const sourceText = extractSourceText(node, context);
	const rawText = sourceText || serializeNodeToRawText(node);
	const firstLine = rawText.split("\n")[0] || rawText;
	return {
		type: "opaque_block",
		attrs: {
			rawText: rawText,
			firstLine: firstLine
		}
	};
}

function convertNodes(context, nodes) {
	if(nodes === undefined || nodes.length === 0) {
		return [];
	}
	return nodes.reduce((accumulator, node) => accumulator.concat(convertANode(context, node)), []);
}

function convertANode(context, node) {
	const builder = context[node.type];
	if(typeof builder === "function") {
		const convertedNode = builder(context, node);
		return Array.isArray(convertedNode) ? convertedNode : [convertedNode];
	}
	return [buildOpaqueFromNode(node, context)];
}

exports.childContext = childContext;
exports.wrapTextNodesInParagraphs = wrapTextNodesInParagraphs;
exports.buildTextWithMark = buildTextWithMark;
exports.extractPlainText = extractPlainText;
exports.serializeNodeToRawText = serializeNodeToRawText;
exports.buildOpaqueFromNode = buildOpaqueFromNode;
exports.convertNodes = convertNodes;
exports.convertANode = convertANode;
