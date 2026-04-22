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

// prosemirror-tables — conditional require (not available in Node tests)
let pmTables;
try {
	pmTables = require("prosemirror-tables");
} catch(e) {
	pmTables = null;
}

function buildSchema() {
	let baseNodes = basicSchema.spec.nodes.append({ list: createListSpec() });

	// Override blockquote to add cite attr for preserving <<<...<<<cite text
	const baseBqSpec = basicSchema.spec.nodes.get("blockquote");
	baseNodes = baseNodes.update("blockquote", {
		...baseBqSpec,
		attrs: { cite: { default: null } },
		toDOM() { return ["blockquote", 0]; },
		parseDOM: [{ tag: "blockquote" }]
	});

	// Extend image node with TW-specific attrs (width, height, source, kind, tooltip)
	const baseImageSpec = basicSchema.spec.nodes.get("image");
	let nodes = baseNodes.update("image", {
		...baseImageSpec,
		attrs: {
			...(baseImageSpec && baseImageSpec.attrs),
			width: { default: null },
			height: { default: null },
			twSource: { default: null },
			twKind: { default: "shortcut" },
			twTooltip: { default: null }
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
	}).append({
		pragma_block: {
			attrs: { rawText: { default: "" }, firstLine: { default: "" } },
			group: "block", atom: true, selectable: true, draggable: true,
			toDOM(node) {
				const wrapper = document.createElement("div");
				wrapper.className = "pm-pragma-block";
				wrapper.setAttribute("data-raw-text", node.attrs.rawText);
				wrapper.setAttribute("data-first-line", node.attrs.firstLine);
				wrapper.setAttribute("contenteditable", "false");
				const label = document.createElement("span");
				label.className = "pm-pragma-block-label";
				label.textContent = node.attrs.firstLine || "(pragma)";
				wrapper.appendChild(label);
				return wrapper;
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
			attrs: { rawText: { default: "" }, firstLine: { default: "" } },
			group: "block", atom: true, selectable: true, draggable: true,
			toDOM(node) {
				const wrapper = document.createElement("div");
				wrapper.className = "pm-opaque-block";
				wrapper.setAttribute("data-raw-text", node.attrs.rawText);
				wrapper.setAttribute("data-first-line", node.attrs.firstLine);
				wrapper.setAttribute("contenteditable", "false");
				const label = document.createElement("span");
				label.className = "pm-opaque-block-label";
				label.textContent = node.attrs.firstLine || "(unsupported block)";
				wrapper.appendChild(label);
				return wrapper;
			},
			parseDOM: [{
				tag: "div.pm-opaque-block",
				getAttrs(dom) {
					return {
						rawText: dom.getAttribute("data-raw-text") || "",
						firstLine: dom.getAttribute("data-first-line") || ""
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
			attrs: { rawText: { default: "" }, parseType: { default: "" }, renderType: { default: null } },
			group: "block", atom: true, selectable: true, draggable: true,
			toDOM(node) {
				const wrapper = document.createElement("div");
				wrapper.className = "pm-typed-block";
				wrapper.setAttribute("data-raw-text", node.attrs.rawText);
				wrapper.setAttribute("data-parse-type", node.attrs.parseType);
				if(node.attrs.renderType) wrapper.setAttribute("data-render-type", node.attrs.renderType);
				wrapper.setAttribute("contenteditable", "false");
				const label = document.createElement("span");
				label.className = "pm-typed-block-label";
				label.textContent = "$$$" + (node.attrs.parseType || "");
				wrapper.appendChild(label);
				return wrapper;
			},
			parseDOM: [{
				tag: "div.pm-typed-block",
				getAttrs(dom) {
					return {
						rawText: dom.getAttribute("data-raw-text") || "",
						parseType: dom.getAttribute("data-parse-type") || "",
						renderType: dom.getAttribute("data-render-type") || null
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

	// Override the link mark from basicSchema to preserve TiddlyWiki internal link targets.
	// The default link mark's toDOM renders <a href="TiddlerName"> which the browser resolves
	// to a full URL. We store the raw href in data-tw-href and read it back in parseDOM.
	const baseLinkSpec = basicSchema.spec.marks.get("link");
	const extendedMarks = basicSchema.spec.marks.update("link", {
		...baseLinkSpec,
		toDOM(node) {
			const { href, title } = node.attrs;
			const isExternal = /^(?:https?|ftp|mailto):/i.test(href);
			return ["a", {
				href: isExternal ? href : `#${encodeURIComponent(href)}`,
				title,
				"data-tw-href": href
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
	}).append({
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
