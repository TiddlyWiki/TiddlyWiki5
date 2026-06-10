/*\
title: $:/plugins/tiddlywiki/prosemirror/features/link-classes.js
type: application/javascript
module-type: library

ProseMirror plugin that dynamically applies TiddlyWiki link CSS classes
to <a> elements inside the editor, using the wiki API to determine link
state (resolves / missing / shadow / external).

This mirrors what $tw/modules/widgets/link.js does at render time:
  - tc-tiddlylink              (always)
  - tc-tiddlylink-resolves     (wiki.tiddlerExists)
  - tc-tiddlylink-missing      (!wiki.tiddlerExists && !wiki.isShadowTiddler)
  - tc-tiddlylink-shadow       (wiki.isShadowTiddler)
  - tc-tiddlylink-external     (href matches https?/ftp/mailto)

\*/

"use strict";

const { Plugin, PluginKey } = require("prosemirror-state");

const linkClassesKey = new PluginKey("linkClasses");

/** Check whether a raw href is an external URL. */
function isExternalHref(href) {
	return /^(?:https?|ftp|mailto):/i.test(href);
}

function getLinkClasses(wiki, rawHref) {
	const classes = ["tc-tiddlylink"];
	if(isExternalHref(rawHref)) {
		classes.push("tc-tiddlylink-external");
	} else {
		const isShadow = wiki.isShadowTiddler(rawHref);
		if(isShadow) {
			classes.push("tc-tiddlylink-shadow");
		}
		if(wiki.tiddlerExists(rawHref)) {
			classes.push("tc-tiddlylink-resolves");
		} else if(!isShadow) {
			classes.push("tc-tiddlylink-missing");
		}
	}
	return classes.join(" ");
}

function withStoppedDomObserver(view, callback) {
	const domObserver = view && view.domObserver;
	if(domObserver && domObserver.stop && domObserver.start) {
		domObserver.stop();
		try {
			callback();
		} finally{
			domObserver.start();
		}
	} else {
		callback();
	}
}

/**
 * Walk every <a data-tw-href> inside the ProseMirror editor DOM and apply
 * the TW link classes based on the current wiki state.
 *
 * @param {EditorView} view
 * @param {object} wiki – $tw.wiki
 */
function updateLinkClasses(view, wiki) {
	const dom = view && view.dom;
	if(!dom) return;
	withStoppedDomObserver(view, () => {
		const links = dom.querySelectorAll("a[data-tw-href]");
		for(let i = 0; i < links.length; i++) {
			const link = links[i];
			const rawHref = link.getAttribute("data-tw-href") || "";
			const desired = getLinkClasses(wiki, rawHref);
			if(link.className !== desired) {
				link.className = desired;
			}
		}
	});
}

function collectInternalLinkTargets(doc) {
	const linkType = doc.type.schema.marks.link;
	const targets = Object.create(null);
	if(!linkType) {
		return targets;
	}
	doc.descendants((node) => {
		if(!node.isText) {
			return;
		}
		const linkMark = node.marks.find((mark) => mark.type === linkType);
		if(linkMark) {
			const rawHref = linkMark.attrs.href || "";
			if(!isExternalHref(rawHref)) {
				targets[rawHref] = true;
			}
		}
	});
	return targets;
}

function hasRelevantLinkChange(doc, changedTiddlers) {
	const targets = collectInternalLinkTargets(doc);
	for(const title in changedTiddlers) {
		if(targets[title]) {
			return true;
		}
	}
	return false;
}

/**
 * Create the ProseMirror plugin.
 *
 * @param {object} wiki – $tw.wiki
 * @returns {Plugin}
 */
function createLinkClassesPlugin(wiki) {
	return new Plugin({
		key: linkClassesKey,
		view(editorView) {
			let view = editorView;
			let destroyed = false;
			let pendingRefresh = false;
			updateLinkClasses(view, wiki);
			const refreshLinkClasses = (changedTiddlers) => {
				if(destroyed || pendingRefresh || !view || !hasRelevantLinkChange(view.state.doc, changedTiddlers)) {
					return;
				}
				pendingRefresh = true;
				setTimeout(() => {
					pendingRefresh = false;
					if(destroyed || !view) {
						return;
					}
					updateLinkClasses(view, wiki);
				}, 0);
			};
			if(wiki && wiki.addEventListener) {
				wiki.addEventListener("change", refreshLinkClasses);
			}
			return {
				update(nextView) {
					view = nextView;
					updateLinkClasses(view, wiki);
				},
				destroy() {
					destroyed = true;
					if(wiki && wiki.removeEventListener) {
						wiki.removeEventListener("change", refreshLinkClasses);
					}
				}
			};
		}
	});
}

exports.createLinkClassesPlugin = createLinkClassesPlugin;
exports.updateLinkClasses = updateLinkClasses;
