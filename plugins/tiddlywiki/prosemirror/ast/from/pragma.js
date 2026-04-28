/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/pragma.js
type: application/javascript
module-type: library
\*/

"use strict";

function pragmaBlock(builders, node) {
	const rawText = node.attrs && node.attrs.rawText || "";
	let parsedNodes = [];
	try {
		const parseResult = $tw.wiki.parseText(null, rawText);
		if(parseResult && parseResult.tree) {
			parsedNodes = parseResult.tree;
		}
	} catch(e) {
		return {
			type: "element",
			tag: "p",
			children: [{ type: "text", text: rawText }]
		};
	}
	if(parsedNodes.length > 0) {
		return parsedNodes.map((pragmaNode) => {
			let result = {};
			for(const key in pragmaNode) {
				if(pragmaNode.hasOwnProperty(key) && key !== "children") {
					result[key] = pragmaNode[key];
				}
			}
			result.children = [];
			return result;
		});
	}
	return { type: "text", text: rawText };
}

function opaqueBlock(builders, node) {
	const rawText = node.attrs && node.attrs.rawText || "";
	try {
		const parseResult = $tw.wiki.parseText(null, rawText);
		if(parseResult && parseResult.tree) {
			return parseResult.tree;
		}
	} catch(e) {
		// ignore
	}
	return { type: "text", text: rawText };
}

function typedBlock(builders, node) {
	var rawText = node.attrs && node.attrs.rawText || "";
	var parseType = node.attrs && node.attrs.parseType || "";
	var renderType = node.attrs && node.attrs.renderType || null;
	var parser = $tw.wiki.parseText(parseType, rawText, { defaultType: "text/plain" });
	var children = parser && parser.tree ? parser.tree : [];
	if(!renderType) {
		return {
			type: "void",
			rule: "typedblock",
			children: $tw.utils.isArray(children) ? children : [children],
			parseType: parseType,
			renderType: renderType,
			text: rawText
		};
	}
	var widgetNode = $tw.wiki.makeWidget(parser);
	var container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container, null);
	var renderResult = renderType === "text/html" ? container.innerHTML : container.textContent;
	return {
		type: "void",
		rule: "typedblock",
		children: [{
			type: "element",
			tag: "pre",
			children: [{ type: "text", text: renderResult }]
		}],
		parseType: parseType,
		renderType: renderType,
		text: rawText
	};
}

exports.pragmaBlock = pragmaBlock;
exports.opaqueBlock = opaqueBlock;
exports.typedBlock = typedBlock;
