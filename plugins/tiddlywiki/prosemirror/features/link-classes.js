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

/**
 * Walk every <a data-tw-href> inside the ProseMirror editor DOM and apply
 * the TW link classes based on the current wiki state.
 *
 * @param {EditorView} view
 * @param {object} wiki – $tw.wiki
 */
function updateLinkClasses(view, wiki) {
	const dom = view.dom;
	if(!dom) return;
	const links = dom.querySelectorAll("a[data-tw-href]");
	for(let i = 0; i < links.length; i++) {
		const link = links[i];
		const rawHref = link.getAttribute("data-tw-href") || "";
		const isExternal = isExternalHref(rawHref);

		// Build the target class list the same way LinkWidget.execute() does
		const classes = ["tc-tiddlylink"];
		if(isExternal) {
			classes.push("tc-tiddlylink-external");
		} else {
			if(wiki.isShadowTiddler(rawHref)) {
				classes.push("tc-tiddlylink-shadow");
			}
			if(wiki.tiddlerExists(rawHref)) {
				classes.push("tc-tiddlylink-resolves");
			} else if(!wiki.isShadowTiddler(rawHref)) {
				classes.push("tc-tiddlylink-missing");
			}
		}

		const desired = classes.join(" ");
		if(link.className !== desired) {
			link.className = desired;
		}
	}
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
			// Apply once on init
			updateLinkClasses(editorView, wiki);
			return {
				update(view) {
					updateLinkClasses(view, wiki);
				}
			};
		}
	});
}

exports.createLinkClassesPlugin = createLinkClassesPlugin;
