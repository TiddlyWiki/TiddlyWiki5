/*\
title: $:/plugins/tiddlywiki/prosemirror/image/plugin.js
type: application/javascript
module-type: library

ProseMirror plugin that provides a nodeView for images.

\*/

"use strict";

const Plugin = require("prosemirror-state").Plugin;
const PluginKey = require("prosemirror-state").PluginKey;
const ImageNodeView = require("$:/plugins/tiddlywiki/prosemirror/image/nodeview.js").ImageNodeView;

function createImageNodeViewPlugin(parentWidget) {
	return new Plugin({
		key: new PluginKey("twImageNodeView"),
		props: {
			nodeViews: {
				image(node, view, getPos) {
					return new ImageNodeView(node, view, getPos, parentWidget);
				}
			}
		}
	});
}

exports.createImageNodeViewPlugin = createImageNodeViewPlugin;
