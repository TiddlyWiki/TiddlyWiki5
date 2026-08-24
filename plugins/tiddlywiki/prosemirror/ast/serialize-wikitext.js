/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/serialize-wikitext.js
type: application/javascript
module-type: library

Serializes ProseMirror nodes with the WikiText serializer while keeping the
empty-paragraph delimiter rule local to this editor adapter.

\*/

"use strict";

const wikiAstFromProseMirrorAst = require("$:/plugins/tiddlywiki/prosemirror/ast/from-prosemirror.js").from;

function serializeQuoteBlock(node) {
	const children = node.children || [];
	const body = [];
	let cite = "";
	for(let index = 0; index < children.length; index++) {
		if(children[index].type === "element" && children[index].tag === "cite") {
			cite = $tw.utils.serializeWikitextParseTree(children[index].children || []).trim().replace(/\r?\n/g," ");
		} else {
			body.push(children[index]);
		}
	}
	const classValue = node.attributes && node.attributes.class && node.attributes.class.value || "";
	const classes = classValue.split(/\s+/).filter(function(className) {
		return className && className !== "tc-quote";
	});
	const bodyText = serializeWikiAst(body, { atDocumentStart: true }).trimEnd();
	return "<<<" + classes.map(function(className) {
		return "." + className;
	}).join("") + "\n" + bodyText + "\n<<<" + (cite ? " " + cite : "") + "\n\n";
}

function serializeWikiAst(tree, options) {
	options = options || {};
	const nodes = Array.isArray(tree) ? tree : [tree];
	let atDocumentStart = !!options.atDocumentStart;
	let output = "";
	for(let index = 0; index < nodes.length; index++) {
		const node = nodes[index];
		if(node && node.rule === "blankline") {
			output += atDocumentStart ? "\n\n" : "\n";
		} else if(node && node.rule === "quoteblock") {
			output += serializeQuoteBlock(node);
		} else if(node) {
			output += $tw.utils.serializeWikitextParseTree(node);
		}
		atDocumentStart = false;
	}
	return output;
}

function serializeProseMirrorNodes(nodes, options) {
	return serializeWikiAst(wikiAstFromProseMirrorAst(nodes), options);
}

exports.serializeWikiAst = serializeWikiAst;
exports.serializeProseMirrorNodes = serializeProseMirrorNodes;
