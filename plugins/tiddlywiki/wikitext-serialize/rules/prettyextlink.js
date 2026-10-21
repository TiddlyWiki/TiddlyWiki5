/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/prettyextlink.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "prettyextlink";

exports.serialize = function(tree,serialize,options) {
	var url = tree.attributes.href.value,
		tooltip = require("$:/plugins/tiddlywiki/wikitext-serialize/rules/prettylink.js").plainText(tree);
	// The bracket form holds plain text only; formatted text needs the anchor element
	if(tooltip === null) {
		var attributes = tree.orderedAttributes || Object.keys(tree.attributes).map(function(name) {
			return $tw.utils.extend({name: name},tree.attributes[name]);
		});
		return "<a " + attributes.map(function(attribute) {
			return $tw.utils.serializeAttribute(attribute,options);
		}).join(" ") + ">" + serialize(tree.children) + "</a>";
	}
	return "[ext[" + (tooltip !== "" && tooltip !== url ? tooltip + "|" : "") + url + "]]";
};
