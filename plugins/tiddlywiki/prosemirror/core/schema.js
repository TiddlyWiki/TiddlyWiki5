/*\
title: $:/plugins/tiddlywiki/prosemirror/core/schema.js
type: application/javascript
module-type: library

Builds the ProseMirror schema with TiddlyWiki-specific node and mark types.
Shared between the engine and test modules.

\*/

"use strict";

const { Schema } = require("prosemirror-model");
const { schema: basicSchema } = require("prosemirror-schema-basic");
const { createListSpec } = require("prosemirror-flat-list");
const getSourceAttrSpec = require("$:/plugins/tiddlywiki/prosemirror/ast/source-preservation.js").getSourceAttrSpec;

// Source atoms keep their body in attrs rather than text children. ProseMirror
// uses leafText for plain-text clipboard output (including cut), so include
// the current source body alongside ordinary selected text.
function sourceLeafText(node) {
	return node.attrs.rawText;
}

// prosemirror-tables — conditional require (not available in Node tests)
let pmTables;
try {
	pmTables = require("prosemirror-tables");
} catch(e) {
	pmTables = null;
}

function addSourceAttrsToBlockNodes(nodes) {
	let result = nodes;
	nodes.forEach((name, spec) => {
		const groups = (spec.group || "").split(/\s+/).filter(Boolean);
		if(groups.includes("block")) {
			result = result.update(name, Object.assign({}, spec, {
				attrs: Object.assign({}, spec.attrs || {}, getSourceAttrSpec())
			}));
		}
	});
	return result;
}

function buildSchema() {
	let baseNodes = basicSchema.spec.nodes.append({ list: createListSpec() });
	const baseCodeSpec = basicSchema.spec.nodes.get("code_block");
	baseNodes = baseNodes.update("code_block", Object.assign({}, baseCodeSpec, {
		attrs: { language: { default: "" } },
		toDOM(node) {
			return ["pre", ["code", node.attrs.language ? { "data-language": node.attrs.language } : {}, 0]];
		},
		parseDOM: [{
			tag: "pre", preserveWhitespace: "full",
			getAttrs(dom) {
				const code = dom.querySelector("code");
				return { language: code && code.getAttribute("data-language") || "" };
			}
		}]
	}));

	// Preserve WikiText quote metadata even when the quote body is edited.
	const baseBqSpec = basicSchema.spec.nodes.get("blockquote");
	baseNodes = baseNodes.update("blockquote", Object.assign({}, baseBqSpec, {
		attrs: {
			cite: { default: null },
			twClasses: { default: null }
		},
		toDOM(node) {
			const attrs = {};
			if(node.attrs.cite) attrs["data-tw-cite"] = node.attrs.cite;
			if(node.attrs.twClasses) attrs["data-tw-classes"] = node.attrs.twClasses;
			return ["blockquote", attrs, 0];
		},
		parseDOM: [{
			tag: "blockquote",
			getAttrs(dom) {
				return {
					cite: dom.getAttribute("data-tw-cite") || null,
					twClasses: dom.getAttribute("data-tw-classes") || null
				};
			}
		}]
	}));

	// Extend image node with TW-specific attrs (width, height, source, kind, tooltip)
	const baseImageSpec = basicSchema.spec.nodes.get("image");
	const imageAttrs = Object.assign({}, baseImageSpec && baseImageSpec.attrs, {
		width: { default: null },
		height: { default: null },
		twSource: { default: null },
		twKind: { default: "shortcut" },
		twTooltip: { default: null }
	});
	let nodes = baseNodes.update("image", Object.assign({}, baseImageSpec, {
		attrs: {
			src: imageAttrs.src,
			alt: imageAttrs.alt,
			title: imageAttrs.title,
			width: imageAttrs.width,
			height: imageAttrs.height,
			twSource: imageAttrs.twSource,
			twKind: imageAttrs.twKind,
			twTooltip: imageAttrs.twTooltip
		},
		toDOM(node) {
			const attrs = {
				src: node.attrs.src,
				alt: node.attrs.alt,
				title: node.attrs.title
			};
			if(node.attrs.width) attrs.width = node.attrs.width;
			if(node.attrs.height) attrs.height = node.attrs.height;
			if(node.attrs.twSource) attrs["data-tw-source"] = node.attrs.twSource;
			if(node.attrs.twKind) attrs["data-tw-kind"] = node.attrs.twKind;
			if(node.attrs.twTooltip) attrs["data-tw-tooltip"] = node.attrs.twTooltip;
			return ["img", attrs];
		},
		parseDOM: [{
			tag: "img[src]",
			getAttrs(dom) {
				return {
					src: dom.getAttribute("src"),
					title: dom.getAttribute("title"),
					alt: dom.getAttribute("alt"),
					width: dom.getAttribute("width") || null,
					height: dom.getAttribute("height") || null,
					twSource: dom.getAttribute("data-tw-source") || null,
					twKind: dom.getAttribute("data-tw-kind") || "shortcut",
					twTooltip: dom.getAttribute("data-tw-tooltip") || null
				};
			}
		}]
	})).append({
		pragma_block: {
			attrs: { rawText: { default: "" }, firstLine: { default: "" } },
			group: "block", atom: true, selectable: true, draggable: true,
			leafText: sourceLeafText,
			toDOM(node) {
				return ["div", {
					class: "pm-pragma-block",
					"data-raw-text": node.attrs.rawText,
					"data-first-line": node.attrs.firstLine,
					contenteditable: "false"
				}, ["span", { class: "pm-pragma-block-label" }, node.attrs.firstLine || "(pragma)"]];
			},
			parseDOM: [{
				tag: "div.pm-pragma-block",
				getAttrs(dom) {
					return {
						rawText: dom.getAttribute("data-raw-text") || "",
						firstLine: dom.getAttribute("data-first-line") || ""
					};
				}
			}]
		},
		opaque_block: {
			attrs: { rawText: { default: "" }, firstLine: { default: "" }, parseTreeJson: { default: null }, autoEdit: { default: false } },
			group: "block", atom: true, selectable: true, draggable: false,
			leafText: sourceLeafText,
			toDOM(node) {
				const attrs = {
					class: "pm-opaque-block",
					"data-raw-text": node.attrs.rawText,
					"data-first-line": node.attrs.firstLine,
					contenteditable: "false"
				};
				if(node.attrs.parseTreeJson) attrs["data-parse-tree-json"] = node.attrs.parseTreeJson;
				return ["div", attrs, ["span", { class: "pm-opaque-block-label" }, node.attrs.firstLine || "(unsupported block)"]];
			},
			parseDOM: [{
				tag: "div.pm-opaque-block",
				getAttrs(dom) {
					return {
						rawText: dom.getAttribute("data-raw-text") || "",
						firstLine: dom.getAttribute("data-first-line") || "",
						parseTreeJson: dom.getAttribute("data-parse-tree-json") || null,
						autoEdit: false
					};
				}
			}]
		},
		opaque_inline: {
			attrs: { rawText: { default: "" }, firstLine: { default: "" }, parseTreeJson: { default: null } },
			group: "inline", inline: true, atom: true, selectable: true, draggable: false,
			leafText: sourceLeafText,
			toDOM(node) {
				const attrs = {
					class: "pm-opaque-inline",
					"data-raw-text": node.attrs.rawText,
					contenteditable: "false"
				};
				if(node.attrs.parseTreeJson) attrs["data-parse-tree-json"] = node.attrs.parseTreeJson;
				return ["span", attrs, node.attrs.rawText || "(inline source)"];
			},
			parseDOM: [{
				tag: "span.pm-opaque-inline",
				getAttrs(dom) {
					const rawText = dom.getAttribute("data-raw-text") || "";
					return {
						rawText: rawText,
						firstLine: rawText.split("\n")[0] || rawText,
						parseTreeJson: dom.getAttribute("data-parse-tree-json") || null
					};
				}
			}]
		},
		definition_list: {
			group: "block",
			content: "(definition_term | definition_description)+",
			toDOM() { return ["dl", { class: "pm-definition-list" }, 0]; },
			parseDOM: [{ tag: "dl" }]
		},
		definition_term: {
			content: "inline*",
			toDOM() { return ["dt", 0]; },
			parseDOM: [{ tag: "dt" }],
			defining: true
		},
		definition_description: {
			content: "inline*",
			toDOM() { return ["dd", 0]; },
			parseDOM: [{ tag: "dd" }],
			defining: true
		},
		hard_line_breaks_block: {
			group: "block",
			content: "inline*",
			toDOM() { return ["div", { class: "pm-hard-line-breaks-block-wrapper" }, 0]; },
			parseDOM: [{ tag: "div.pm-hard-line-breaks-block-wrapper" }]
		},
		typed_block: {
			attrs: { rawText: { default: "" }, parseType: { default: "" }, renderType: { default: null }, autoEdit: { default: false } },
			group: "block", atom: true, selectable: true, draggable: true,
			leafText: sourceLeafText,
			toDOM(node) {
				const attrs = {
					class: "pm-typed-block",
					"data-raw-text": node.attrs.rawText,
					"data-parse-type": node.attrs.parseType,
					contenteditable: "false"
				};
				if(node.attrs.renderType) attrs["data-render-type"] = node.attrs.renderType;
				return ["div", attrs, ["span", { class: "pm-typed-block-label" }, "$$$" + (node.attrs.parseType || "")]];
			},
			parseDOM: [{
				tag: "div.pm-typed-block",
				getAttrs(dom) {
					return {
						rawText: dom.getAttribute("data-raw-text") || "",
						parseType: dom.getAttribute("data-parse-type") || "",
						renderType: dom.getAttribute("data-render-type") || null,
						autoEdit: false
					};
				}
			}]
		}
	});

	// Add table nodes if prosemirror-tables is available
	if(pmTables) {
		const tableNodeSpecs = pmTables.tableNodes({
			tableGroup: "block",
			cellContent: "block+",
			cellAttributes: {
				align: {
					default: null,
					getFromDOM(dom) { return dom.getAttribute("align") || dom.style.textAlign || null; },
					setDOMAttr(value, attrs) { if(value) attrs.align = value; }
				},
				valign: {
					default: null,
					getFromDOM(dom) { return dom.getAttribute("valign") || dom.style.verticalAlign || null; },
					setDOMAttr(value, attrs) { if(value) attrs.valign = value; }
				},
				background: {
					default: null,
					getFromDOM(dom) { return dom.style.backgroundColor || null; },
					setDOMAttr(value, attrs) {
						if(value) attrs.style = (attrs.style || "") + `background-color: ${value};`;
					}
				}
			}
		});
		nodes = nodes.append(tableNodeSpecs);
	}

	// Source provenance belongs to editor state. Adding these attrs to every
	// block type lets top-level parser segments survive ordinary transactions,
	// including split, join, drag, undo and redo.
	nodes = addSourceAttrsToBlockNodes(nodes);

	// Override the link mark from basicSchema to preserve TiddlyWiki internal link targets.
	// The default link mark's toDOM renders <a href="TiddlerName"> which the browser resolves
	// to a full URL. We store the raw href in data-tw-href and read it back in parseDOM.
	const baseLinkSpec = basicSchema.spec.marks.get("link");
	const extendedMarks = basicSchema.spec.marks.update("link", Object.assign({}, baseLinkSpec, {
		toDOM(node) {
			const { href, title } = node.attrs;
			const isExternal = /^(?:https?|ftp|mailto):/i.test(href);
			return ["a", {
				href: isExternal ? href : `#${encodeURIComponent(href)}`,
				title,
				"data-tw-href": href,
				class: isExternal ? "tc-tiddlylink tc-tiddlylink-external" : "tc-tiddlylink"
			}, 0];
		},
		parseDOM: [{
			tag: "a[href]",
			getAttrs(dom) {
				// Prefer data-tw-href (our custom attribute) over href (may be resolved by the browser)
				const rawHref = dom.getAttribute("data-tw-href") || dom.getAttribute("href") || "";
				return {
					href: rawHref,
					title: dom.getAttribute("title")
				};
			}
		}]
	})).append({
		underline: {
			parseDOM: [{ tag: "u" }, { style: "text-decoration=underline" }],
			toDOM() { return ["u", 0]; }
		},
		strike: {
			parseDOM: [{ tag: "strike" }, { tag: "s" }, { tag: "del" }, { style: "text-decoration=line-through" }],
			toDOM() { return ["strike", 0]; }
		},
		superscript: {
			parseDOM: [{ tag: "sup" }],
			toDOM() { return ["sup", 0]; },
			excludes: "subscript"
		},
		subscript: {
			parseDOM: [{ tag: "sub" }],
			toDOM() { return ["sub", 0]; },
			excludes: "superscript"
		}
	});

	return new Schema({ nodes, marks: extendedMarks });
}

exports.buildSchema = buildSchema;
