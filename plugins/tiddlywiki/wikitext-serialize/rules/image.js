/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/image.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "image";

exports.serialize = function(tree,serialize,options) {
	var result = "[img";
	// Image nodes carry plain attributes in insertion order, so any attribute
	// such as class survives, not just width and height
	$tw.utils.each(tree.attributes,function(attribute,name) {
		if(name !== "source" && name !== "tooltip") {
			result += " " + $tw.utils.serializeAttribute(attribute,options);
		}
	});
	if(result !== "[img") {
		result += " ";
	}
	var tooltip = tree.attributes.tooltip ? tree.attributes.tooltip.value + "|" : "";
	return result + "[" + tooltip + tree.attributes.source.value + "]]";
};
