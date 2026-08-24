/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/source-preservation.js
type: application/javascript
module-type: library

Keeps the original WikiText for unchanged top-level ProseMirror node groups.
The metadata is editor state only and is never emitted by the WikiText
serializer.

\*/

"use strict";

const SOURCE_ATTR_NAMES = [
	"twSourceGroup",
	"twSourceIndex",
	"twSourceCount",
	"twSourceText",
	"twSourceFingerprint"
];

const SOURCE_ATTR_SET = SOURCE_ATTR_NAMES.reduce((result, name) => {
	result[name] = true;
	return result;
}, Object.create(null));

function getSourceAttrSpec() {
	return {
		twSourceGroup: { default: null },
		twSourceIndex: { default: null },
		twSourceCount: { default: null },
		twSourceText: { default: null },
		twSourceFingerprint: { default: null }
	};
}

function cleanValue(value) {
	if(Array.isArray(value)) {
		return value.map(cleanValue);
	}
	if(!value || typeof value !== "object") {
		return value;
	}
	const result = {};
	for(const key in value) {
		if(!Object.prototype.hasOwnProperty.call(value, key)) {
			continue;
		}
		if(key === "attrs") {
			const attrs = {};
			const sourceAttrs = value.attrs || {};
			for(const attrName in sourceAttrs) {
				if(Object.prototype.hasOwnProperty.call(sourceAttrs, attrName) &&
					!SOURCE_ATTR_SET[attrName] && sourceAttrs[attrName] != null) {
					attrs[attrName] = cleanValue(sourceAttrs[attrName]);
				}
			}
			if(Object.keys(attrs).length > 0) {
				result.attrs = attrs;
			}
		} else if(value[key] !== undefined) {
			result[key] = cleanValue(value[key]);
		}
	}
	return result;
}

function stripSourceMetadata(value) {
	return cleanValue(value);
}

function fingerprintNodes(nodes) {
	return JSON.stringify(stripSourceMetadata(nodes || []));
}

function annotateSourceGroup(nodes, sourceText, groupId) {
	const fingerprint = fingerprintNodes(nodes);
	const count = nodes.length;
	return nodes.map((node, index) => {
		const result = Object.assign({}, node);
		result.attrs = Object.assign({}, node.attrs || {}, {
			twSourceGroup: groupId,
			twSourceIndex: index,
			twSourceCount: count,
			twSourceText: index === 0 ? sourceText : null,
			twSourceFingerprint: index === 0 ? fingerprint : null
		});
		return result;
	});
}

function getGroupId(node) {
	return node && node.attrs && node.attrs.twSourceGroup != null ? node.attrs.twSourceGroup : null;
}

function isCompleteUnchangedGroup(nodes) {
	if(nodes.length === 0) {
		return false;
	}
	const firstAttrs = nodes[0].attrs || {};
	const expectedCount = Number(firstAttrs.twSourceCount);
	if(!Number.isInteger(expectedCount) || expectedCount !== nodes.length ||
		typeof firstAttrs.twSourceText !== "string" ||
		typeof firstAttrs.twSourceFingerprint !== "string") {
		return false;
	}
	for(let index = 0; index < nodes.length; index++) {
		const attrs = nodes[index].attrs || {};
		if(Number(attrs.twSourceIndex) !== index || Number(attrs.twSourceCount) !== expectedCount) {
			return false;
		}
	}
	return fingerprintNodes(nodes) === firstAttrs.twSourceFingerprint;
}

function countTrailingNewlines(text) {
	const match = (text || "").match(/(?:\r?\n)+$/);
	return match ? (match[0].match(/\r?\n/g) || []).length : 0;
}

function ensureCanonicalBoundary(output, previousNode, serializeNodes) {
	if(!previousNode || !output) {
		return output;
	}
	const previousCanonical = serializeNodes([stripSourceMetadata(previousNode)], { atDocumentStart: true });
	const canonicalNewlines = countTrailingNewlines(previousCanonical);
	const requiredNewlines = canonicalNewlines > 0 ? canonicalNewlines : 2;
	const missingNewlines = Math.max(0, requiredNewlines - countTrailingNewlines(output));
	return output + "\n".repeat(missingNewlines);
}

function segmentKeepsOwnEnding(nodes) {
	return nodes.length > 0 && nodes.every(function(node) {
		return node && node.type === "opaque_block";
	});
}

function serializeWithPreservedSource(docJSON, serializeNodes) {
	const content = docJSON && Array.isArray(docJSON.content) ? docJSON.content : [];
	let output = "";
	let lastSegmentPreserved = true;
	let lastSegmentRegenerated = false;
	for(let index = 0; index < content.length;) {
		const groupId = getGroupId(content[index]);
		if(groupId === null) {
			output = ensureCanonicalBoundary(output, content[index - 1], serializeNodes);
			output += serializeNodes([stripSourceMetadata(content[index])], { atDocumentStart: index === 0 });
			lastSegmentPreserved = segmentKeepsOwnEnding([content[index]]);
			lastSegmentRegenerated = true;
			index++;
			continue;
		}
		let end = index + 1;
		while(end < content.length && getGroupId(content[end]) === groupId &&
			Number(content[end].attrs && content[end].attrs.twSourceIndex) ===
			Number(content[end - 1].attrs && content[end - 1].attrs.twSourceIndex) + 1) {
			end++;
		}
		const group = content.slice(index, end);
		if(isCompleteUnchangedGroup(group)) {
			if(lastSegmentRegenerated) {
				output = ensureCanonicalBoundary(output, content[index - 1], serializeNodes);
			}
			output += group[0].attrs.twSourceText;
			lastSegmentPreserved = true;
			lastSegmentRegenerated = false;
		} else {
			output = ensureCanonicalBoundary(output, content[index - 1], serializeNodes);
			output += serializeNodes(stripSourceMetadata(group), { atDocumentStart: index === 0 });
			lastSegmentPreserved = segmentKeepsOwnEnding(group);
			lastSegmentRegenerated = true;
		}
		index = end;
	}
	// Serializer rules emit block separators after every canonical block. They
	// are required between blocks, but a regenerated final segment should not
	// invent trailing newlines. Exact source groups keep their original ending.
	return lastSegmentPreserved ? output : output.replace(/(?:\r?\n)+$/g,"");
}

exports.SOURCE_ATTR_NAMES = SOURCE_ATTR_NAMES;
exports.getSourceAttrSpec = getSourceAttrSpec;
exports.stripSourceMetadata = stripSourceMetadata;
exports.fingerprintNodes = fingerprintNodes;
exports.annotateSourceGroup = annotateSourceGroup;
exports.serializeWithPreservedSource = serializeWithPreservedSource;
