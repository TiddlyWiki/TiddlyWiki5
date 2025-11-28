/*\
title: $:/plugins/tiddlywiki/prosemirror/widget-block/plugin.js
type: application/javascript
module-type: library

ProseMirror plugin for widget blocks

\*/

"use strict";

const Plugin = require("prosemirror-state").Plugin;
const PluginKey = require("prosemirror-state").PluginKey;
const Decoration = require("prosemirror-view").Decoration;
const DecorationSet = require("prosemirror-view").DecorationSet;
const WidgetBlockNodeView = require("$:/plugins/tiddlywiki/prosemirror/widget-block/nodeview.js").WidgetBlockNodeView;
const utils = require("$:/plugins/tiddlywiki/prosemirror/widget-block/utils.js");
const parseWidget = utils.parseWidget;

/**
 * Create plugin that adds node views for widget blocks
 */
function createWidgetBlockNodeViewPlugin(parentWidget) {
	return new Plugin({
		key: new PluginKey("widgetBlockNodeView"),
		props: {
			nodeViews: {
				paragraph(node, view, getPos) {
					const text = node.textContent.trim();
					
					// Debug: log all paragraphs
					if(console && console.log) {
						console.log("[WidgetBlockNodeView] Checking paragraph:", text);
					}
					
					const widget = parseWidget(text);
					
					if(widget) {
						if(console && console.log) {
							console.log("[WidgetBlockNodeView] Widget detected:", widget);
						}
						return new WidgetBlockNodeView(node, view, getPos, parentWidget);
					}
					return null; // Use default rendering
				}
			}
		}
	});
}

/**
 * Create a plugin that converts widget syntax in text to decorated blocks
 * This makes widgets show as blocks immediately after typing/pasting
 */
function createWidgetBlockPlugin() {
	return new Plugin({
		key: new PluginKey("widgetBlock"),
		state: {
			init(config, state) {
				return DecorationSet.empty;
			},
			apply(tr, set, oldState, newState) {
				// Rebuild decorations when document changes
				const decorations = [];
				newState.doc.descendants((node, pos) => {
					if(node.type.name === "paragraph" && node.textContent.trim()) {
						const text = node.textContent.trim();
						const widget = parseWidget(text);
						if(widget) {
							// Add a decoration to mark this as a widget block
							decorations.push(
								Decoration.node(pos, pos + node.nodeSize, {
									class: "pm-widget-block"
								})
							);
						}
					}
				});
				return DecorationSet.create(newState.doc, decorations);
			}
		},
		props: {
			decorations(state) {
				return this.getState(state);
			}
		}
	});
}

exports.createWidgetBlockPlugin = createWidgetBlockPlugin;
exports.createWidgetBlockNodeViewPlugin = createWidgetBlockNodeViewPlugin;
