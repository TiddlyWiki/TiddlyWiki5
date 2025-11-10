/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/html.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "html";

exports.serialize = function(tree,serialize) {
	var tag = tree.tag;
	var attributes = tree.orderedAttributes.map(function(attribute) {
			return $tw.utils.serializeAttribute(attribute);
	}).join(" ");
	// Children
	var children = tree.children ? serialize(tree.children) : "";
	var result = "";
	// Self-closing tag
	if(tree.isSelfClosing) {
			result += "<" + tag + (attributes ? " " + attributes : "") + "/>";
	} else {
		// Opening and closing tags
		result += "<" + tag + (attributes ? " " + attributes : "") + ">" + children + "</" + tag + ">";
	}
	if(tree.isBlock) {
		result += "\n\n";
	}
	return result;
};
