/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/to/link.js
type: application/javascript
module-type: library
\*/

"use strict";

const convertNodes = require("$:/plugins/tiddlywiki/prosemirror/ast/to/shared.js").convertNodes;

function applyLinkMark(context, node, target) {
	const content = convertNodes(context, node.children);
	return content.map((childNode) => {
		if(childNode.type === "text") {
			const marks = (childNode.marks || []).slice();
			marks.push({ type: "link", attrs: { href: target, title: null } });
			const result = {};
			for(const key in childNode) {
				if(childNode.hasOwnProperty(key)) {
					result[key] = childNode[key];
				}
			}
			result.marks = marks;
			return result;
		}
		return childNode;
	});
}

function buildLink(context, node) {
	const target = node.attributes && node.attributes.to ? node.attributes.to.value : "";
	return applyLinkMark(context, node, target);
}

function buildAnchor(context, node) {
	const href = node.attributes && node.attributes.href ? node.attributes.href.value : "";
	return applyLinkMark(context, node, href);
}

function buildCite(context, node) {
	return convertNodes(context, node.children);
}

exports.buildLink = buildLink;
exports.buildAnchor = buildAnchor;
exports.buildCite = buildCite;
