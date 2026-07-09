/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/mvvdisplayinline.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "mvvdisplayinline";

exports.serialize = function(tree,serialize,options) {
	var filter = (tree.attributes.text && tree.attributes.text.filter) || "";
	// The parser compiles ((var||sep)) to [(var)join[sep]]; the inner text
	// survives verbatim, so decompiling reconstructs the original exactly.
	// The default separator ", " collapses to the short form.
	var match = /^\[\(([^()|]+)\)join\[([\s\S]*)\]\]$/.exec(filter);
	if(match) {
		return "((" + match[1] + (match[2] === ", " ? "" : "||" + match[2]) + "))";
	}
	// (((filter||sep))) compiles to the filter followed by +[join[sep]]
	match = / \+\[join\[([\s\S]*)\]\]$/.exec(filter);
	if(match) {
		var filterPart = filter.substring(0,filter.length - match[0].length);
		return "(((" + filterPart + (match[1] === ", " ? "" : "||" + match[1]) + ")))";
	}
	// Not a shape this rule generates, e.g. a programmatically built node
	return $tw.utils.serializeFromSource(tree,{source: options && options.source}) || "";
};
