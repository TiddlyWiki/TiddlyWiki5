/*\
title: $:/plugins/tiddlywiki/prosemirror/ast/from/image.js
type: application/javascript
module-type: library
\*/

"use strict";

module.exports = function image(builders, node) {
	const attrs = node && node.attrs || {};
	const source = (attrs.twSource || attrs.src || "").toString();
	const kind = (attrs.twKind || "shortcut").toString();
	if(kind === "widget") {
		const widgetAttrs = {
			source: {
				name: "source",
				type: "string",
				value: source
			}
		};
		const orderedAttrs = [{
			name: "source",
			type: "string",
			value: source
		}];
		if(attrs.width) {
			widgetAttrs.width = { name: "width", type: "string", value: attrs.width.toString() };
			orderedAttrs.push({ name: "width", type: "string", value: attrs.width.toString() });
		}
		if(attrs.height) {
			widgetAttrs.height = { name: "height", type: "string", value: attrs.height.toString() };
			orderedAttrs.push({ name: "height", type: "string", value: attrs.height.toString() });
		}
		if(attrs.twTooltip) {
			widgetAttrs.tooltip = { name: "tooltip", type: "string", value: attrs.twTooltip.toString() };
			orderedAttrs.push({ name: "tooltip", type: "string", value: attrs.twTooltip.toString() });
		}
		return {
			type: "image",
			tag: "$image",
			isSelfClosing: true,
			isBlock: false,
			rule: "html",
			attributes: widgetAttrs,
			orderedAttributes: orderedAttrs
		};
	}
	const attributes = {
		source: { name: "source", type: "string", value: source }
	};
	if(attrs.width) {
		attributes.width = { name: "width", type: "string", value: attrs.width.toString() };
	}
	if(attrs.height) {
		attributes.height = { name: "height", type: "string", value: attrs.height.toString() };
	}
	if(attrs.twTooltip) {
		attributes.tooltip = { name: "tooltip", type: "string", value: attrs.twTooltip.toString() };
	}
	return {
		type: "image",
		rule: "image",
		attributes: attributes
	};
};
