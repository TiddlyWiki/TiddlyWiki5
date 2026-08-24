/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to-prosemirror.js
type: application/javascript
module-type: library

Get the Prosemirror AST from a Wiki AST

\*/

"use strict";

const builders = require("$:/plugins/tiddlywiki/prosemirror/ast/to/registry.js");
const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js").convertNodes;
const sourcePreservation = require("$:/plugins/tiddlywiki/prosemirror/ast/source-preservation.js");
const annotateSourceGroup = sourcePreservation.annotateSourceGroup;
const fingerprintNodes = sourcePreservation.fingerprintNodes;
const serializeProseMirrorNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/serialize-wikitext.js").serializeProseMirrorNodes;

function makeSourceGroupId(sourceText, nodes) {
	const value = sourceText + "\u0000" + fingerprintNodes(nodes);
	let hashA = 2166136261;
	let hashB = 5381;
	for(let index = 0; index < value.length; index++) {
		const code = value.charCodeAt(index);
		hashA ^= code;
		hashA = Math.imul(hashA,16777619);
		hashB = ((hashB << 5) + hashB) ^ code;
	}
	return "tw-source-" + value.length + "-" + (hashA >>> 0).toString(36) + "-" + (hashB >>> 0).toString(36);
}

function makeContext(options) {
	const context = {};
	for(const key in builders) {
		if(Object.prototype.hasOwnProperty.call(builders, key)) {
			context[key] = builders[key];
		}
	}
	if(options) {
		for(const key in options) {
			if(Object.prototype.hasOwnProperty.call(options, key)) {
				context[key] = options[key];
			}
		}
	}
	context.level = 0;
	return context;
}

function canonicalParseTree(value) {
	if(Array.isArray(value)) {
		return value.map(canonicalParseTree);
	}
	if(value && typeof value === "object") {
		const result = {};
		Object.keys(value).sort().forEach((key) => {
			if(key !== "start" && key !== "end") {
				result[key] = canonicalParseTree(value[key]);
			}
		});
		return result;
	}
	return value;
}

function getSourceStart(node, fallback, sourceLength) {
	const start = node && typeof node.start === "number" ? node.start : fallback;
	return Math.max(fallback, Math.min(sourceLength, start));
}

function getDeepEnd(node, fallback, sourceLength) {
	let end = node && typeof node.end === "number" ? node.end : fallback;
	if(node && Array.isArray(node.children)) {
		for(let index = 0; index < node.children.length; index++) {
			end = Math.max(end, getDeepEnd(node.children[index], end, sourceLength));
		}
	}
	return Math.max(fallback, Math.min(sourceLength, end));
}

function makeOpaqueSegment(sourceText) {
	return {
		type: "opaque_block",
		attrs: {
			rawText: sourceText,
			firstLine: (sourceText.split("\n")[0] || sourceText).trim(),
			parseTreeJson: null,
			autoEdit: false
		}
	};
}

function makeBlankParagraphs(count) {
	const result = [];
	for(let index = 0; index < count; index++) {
		result.push({ type: "paragraph" });
	}
	return result;
}

function countBlankParagraphs(whitespace, leading) {
	if(!whitespace || !/^\s+$/.test(whitespace)) {
		return 0;
	}
	const newlineMatches = whitespace.match(/\r?\n/g);
	const newlineCount = newlineMatches ? newlineMatches.length : 0;
	return Math.max(0, newlineCount - (leading ? 1 : 2));
}

function trimTrailingWhitespace(text) {
	return text.replace(/\s+$/,"");
}

function isSafeSegment(node, convertedNodes, sourceText, segmentStart, segmentEnd, options) {
	try {
		const output = serializeProseMirrorNodes(convertedNodes, { atDocumentStart: segmentStart === 0 });
		const segmentText = sourceText.substring(segmentStart, segmentEnd);
		if(trimTrailingWhitespace(segmentText) === trimTrailingWhitespace(output)) {
			return true;
		}

		const nodeStart = getSourceStart(node, segmentStart, sourceText.length);
		const nodeEnd = getDeepEnd(node, nodeStart, sourceText.length);
		const uncoveredSource = sourceText.substring(segmentStart, nodeStart) +
			sourceText.substring(Math.min(nodeEnd, segmentEnd), segmentEnd);
		if(/\S/.test(uncoveredSource)) {
			return false;
		}

		const wiki = options.wiki || $tw.wiki;
		const type = options.sourceType || "text/vnd.tiddlywiki";
		const sourceAst = wiki.parseText(type, segmentText, { preserveBlankLines: true }).tree;
		const outputAst = wiki.parseText(type, output, { preserveBlankLines: true }).tree;
		return JSON.stringify(canonicalParseTree(sourceAst)) === JSON.stringify(canonicalParseTree(outputAst));
	} catch(e) {
		return false;
	}
}

function convertNodesWithSourceSafety(context, nodes, options) {
	const sourceText = options.sourceText || "";
	const starts = [];
	let fallback = 0;
	for(let index = 0; index < nodes.length; index++) {
		const start = index === 0 ? 0 : getSourceStart(nodes[index], fallback, sourceText.length);
		starts.push(start);
		fallback = start;
	}

	let result = [];
	for(let index = 0; index < nodes.length; index++) {
		const segmentStart = starts[index];
		const segmentEnd = index + 1 < starts.length ? starts[index + 1] : sourceText.length;
		const segmentText = sourceText.substring(segmentStart, segmentEnd);
		const nodeStart = getSourceStart(nodes[index], segmentStart, sourceText.length);
		const nodeEnd = getDeepEnd(nodes[index], nodeStart, sourceText.length);
		const leadingBlankParagraphs = index === 0 ? countBlankParagraphs(
			sourceText.substring(segmentStart, nodeStart), true) : 0;
		const trailingBlankParagraphs = countBlankParagraphs(
			sourceText.substring(Math.min(nodeEnd, segmentEnd), segmentEnd), false);
		let convertedNodes = makeBlankParagraphs(leadingBlankParagraphs)
			.concat(convertNodes(context, [nodes[index]]))
			.concat(makeBlankParagraphs(trailingBlankParagraphs));
		if(isSafeSegment(nodes[index], convertedNodes, sourceText, segmentStart, segmentEnd, options)) {
			const groupId = makeSourceGroupId(segmentText, convertedNodes);
			result = result.concat(annotateSourceGroup(convertedNodes, segmentText, groupId));
		} else {
			result.push(makeOpaqueSegment(segmentText));
		}
	}
	return result;
}

function wikiAstToProsemirrorAst(node, options) {
	options = options || {};
	const context = makeContext(options);
	const nodes = Array.isArray(node) ? node : [node];
	const result = options.preserveSource && options.sourceText !== undefined ?
		convertNodesWithSourceSafety(context, nodes, options) : convertNodes(context, nodes);
	if(!result || result.length === 0) {
		const emptyParagraph = { type: "paragraph" };
		return {
			type: "doc",
			content: options.preserveSource && options.sourceText !== undefined ?
				annotateSourceGroup([emptyParagraph], options.sourceText, makeSourceGroupId(options.sourceText, [emptyParagraph])) :
				[emptyParagraph]
		};
	}
	return {
		type: "doc",
		content: result
	};
}

exports.to = wikiAstToProsemirrorAst;
