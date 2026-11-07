/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/image.js
type: application/javascript
module-type: library
\*/

"use strict";

const factory = $tw.utils.wikitextParseTree;

module.exports = function image(builders, node) {
	const attrs = node && node.attrs || {};
	const source = (attrs.twSource || attrs.src || "").toString();
	const kind = (attrs.twKind || "shortcut").toString();
	const options = {};
	if(attrs.width) {
		options.width = attrs.width.toString();
	}
	if(attrs.height) {
		options.height = attrs.height.toString();
	}
	if(attrs.twTooltip) {
		options.tooltip = attrs.twTooltip.toString();
	}
	if(kind === "widget") {
		const attributes = { source: source };
		["width", "height", "tooltip"].forEach((name) => {
			if(options[name] !== undefined) {
				attributes[name] = options[name];
			}
		});
		return factory.widget("$image", attributes, null, { selfClosing: true });
	}
	return factory.image(source, options);
};
