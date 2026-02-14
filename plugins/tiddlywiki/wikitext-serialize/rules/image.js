/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/image.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "image";

exports.serialize = function(tree,serialize) {
	var width = tree.attributes.width ? " " + $tw.utils.serializeAttribute(tree.attributes.width) : "";
	var height = tree.attributes.height ? " " + $tw.utils.serializeAttribute(tree.attributes.height) : "";
	var padSpace = width || height ? " " : "";
	var tooltip = tree.attributes.tooltip ? tree.attributes.tooltip.value + "|" : "";
	var source = tree.attributes.source.value;
	return "[img" + width + height + padSpace + "[" + tooltip + source + "]]";
};
