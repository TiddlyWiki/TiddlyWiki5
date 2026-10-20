/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/pragma.js
type: application/javascript
module-type: library
\*/

"use strict";

const factory = $tw.utils.wikitextParseTree;

function pragmaBlock(builders, node) {
	const rawText = node.attrs && node.attrs.rawText || "";
	const pragmas = factory.pragma(rawText);
	return pragmas.length > 0 ? pragmas : factory.text(rawText);
}

function opaqueBlock(builders, node) {
	return factory.opaque(node.attrs && node.attrs.rawText || "", { block: true });
}

function typedBlock(builders, node) {
	const rawText = node.attrs && node.attrs.rawText || "";
	const parseType = node.attrs && node.attrs.parseType || "";
	const renderType = node.attrs && node.attrs.renderType || null;
	const parser = $tw.wiki.parseText(parseType, rawText, { defaultType: "text/plain" });
	const children = parser && parser.tree ? parser.tree : [];
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
	const widgetNode = $tw.wiki.makeWidget(parser);
	const container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container, null);
	const renderResult = renderType === "text/html" ? container.innerHTML : container.textContent;
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
