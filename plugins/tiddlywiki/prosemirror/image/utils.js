/*\
title: $:/plugins/tiddlywiki/prosemirror/image/utils.js
type: application/javascript
module-type: library

Helpers for handling images in the ProseMirror editor.

\*/

"use strict";

function computeImageSrc(imageSource, wiki) {
	const sourceWiki = wiki || (typeof $tw !== "undefined" && $tw.wiki);
	if(!imageSource || !sourceWiki) {
		return "";
	}

	const tiddler = sourceWiki.getTiddler(imageSource);
	if(!tiddler) {
		// Not a tiddler; treat as URL.
		return imageSource;
	}

	if(!sourceWiki.isImageTiddler(imageSource)) {
		// Not an image tiddler; let it fall back to plain src.
		return imageSource;
	}

	const type = tiddler.fields.type;
	const text = tiddler.fields.text;
	const canonicalUri = tiddler.fields._canonical_uri;

	const typeInfo = (typeof $tw !== "undefined" && $tw.config && $tw.config.contentTypeInfo && $tw.config.contentTypeInfo[type]) || {};
	const deserializerType = typeInfo.deserializerType || type;

	if(text) {
		const encoding = typeInfo.encoding || "utf8";
		if(encoding === "base64") {
			return "data:" + deserializerType + ";base64," + text;
		}
		return "data:" + deserializerType + "," + encodeURIComponent(text);
	}

	if(canonicalUri) {
		return canonicalUri;
	}

	// Trigger load and return empty string for now.
	try {
		sourceWiki.getTiddlerText(imageSource);
	} catch(e) {
		// ignore
	}
	return "";
}

function getImageAttrsFromWikiAstImageNode(node, wiki) {
	const sourceAttr = node && node.attributes && node.attributes.source;
	const source = sourceAttr && (sourceAttr.value || sourceAttr);
	const twSource = source || "";
	const twKind = node && node.tag === "$image" ? "widget" : "shortcut";
	const widthAttr = node && node.attributes && node.attributes.width;
	const width = widthAttr && (widthAttr.value || widthAttr);
	const heightAttr = node && node.attributes && node.attributes.height;
	const height = heightAttr && (heightAttr.value || heightAttr);
	const tooltipAttr = node && node.attributes && node.attributes.tooltip;
	const tooltip = tooltipAttr && (tooltipAttr.value || tooltipAttr);
	return {
		src: computeImageSrc(twSource, wiki),
		alt: "",
		title: tooltip || "",
		width: width || null,
		height: height || null,
		twSource: twSource,
		twKind: twKind,
		twTooltip: tooltip || null
	};
}

exports.computeImageSrc = computeImageSrc;
exports.getImageAttrsFromWikiAstImageNode = getImageAttrsFromWikiAstImageNode;
