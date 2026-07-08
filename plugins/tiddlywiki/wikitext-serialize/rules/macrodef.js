/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/macrodef.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "macrodef";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	var name = tree.attributes.name.value;
	var definition = tree.attributes.value.value;
	// The source slice preserves named \end markers, default quoting and
	// single line form; parameter nodes carry no positions of their own
	var slice = $tw.utils.serializeFromSource(tree,{source: options.source, fragments: [name,definition]});
	if(slice !== null) {
		return slice + "\n\n" + serialize(tree.children);
	}
	var params = tree.params.map(function(param) {
		return param.name + (param.default ? ":" + param.default : "");
	}).join(",");
	if(tree.isBlock) {
		return "\\define " + name + "(" + params + ") " + definition + "\n\n" + serialize(tree.children);
	}
	return "\\define " + name + "(" + params + ")\n" + definition + "\n\\end\n\n" + serialize(tree.children);
};
