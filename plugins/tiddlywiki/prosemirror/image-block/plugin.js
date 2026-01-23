/*\
title: $:/plugins/tiddlywiki/prosemirror/image-block/plugin.js
type: application/javascript
module-type: library

ProseMirror plugin that converts standalone image wiki syntax into an inline image node.
This enables Notion-like paste/type workflows: paste `[img[...]]` or `<$image .../>` and
see the image immediately.

\*/

"use strict";

const Plugin = require("prosemirror-state").Plugin;
const PluginKey = require("prosemirror-state").PluginKey;

const getImageAttrsFromWikiAstImageNode = require("$:/plugins/tiddlywiki/prosemirror/image/utils.js").getImageAttrsFromWikiAstImageNode;

function extractStandaloneImageAstFromText(text) {
	if(typeof $tw === "undefined" || !$tw.wiki || !text) {
		return null;
	}
	const trimmed = text.trim();
	if(!trimmed) {
		return null;
	}
	// Fast prefix guard to avoid parsing most paragraphs.
	if(!(trimmed.startsWith("[img[") || trimmed.startsWith("<$image"))) {
		return null;
	}

	let tree;
	try {
		tree = $tw.wiki.parseText("text/vnd.tiddlywiki", trimmed).tree;
	} catch(e) {
		return null;
	}
	// Expect a single paragraph containing a single image node.
	if(!Array.isArray(tree) || tree.length !== 1) {
		return null;
	}
	const p = tree[0];
	if(!p || p.type !== "element" || p.tag !== "p" || !Array.isArray(p.children)) {
		return null;
	}
	if(p.children.length !== 1) {
		return null;
	}
	const child = p.children[0];
	if(!child || child.type !== "image") {
		return null;
	}
	return child;
}

function createImageBlockPlugin(options) {
	options = options || {};
	const key = new PluginKey("twImageBlock");

	return new Plugin({
		key,
		appendTransaction(transactions, oldState, newState) {
			if(!transactions || !transactions.some(tr => tr.docChanged)) {
				return null;
			}

			const imageType = newState.schema.nodes.image;
			if(!imageType) {
				return null;
			}

			const matches = [];
			newState.doc.descendants((node, pos) => {
				if(node.type.name !== "paragraph") {
					return true;
				}
				if(node.childCount !== 1 || !node.child(0).isText) {
					return true;
				}
				const imageAst = extractStandaloneImageAstFromText(node.textContent);
				if(!imageAst) {
					return true;
				}
				matches.push({
					from: pos + 1,
					to: pos + node.nodeSize - 1,
					attrs: getImageAttrsFromWikiAstImageNode(imageAst)
				});
				return true;
			});

			if(matches.length === 0) {
				return null;
			}

			let tr = newState.tr;
			for(let i = matches.length - 1; i >= 0; i--) {
				const m = matches[i];
				const imageNode = imageType.create(m.attrs);
				tr = tr.replaceWith(m.from, m.to, imageNode);
			}
			return tr;
		}
	});
}

exports.createImageBlockPlugin = createImageBlockPlugin;
