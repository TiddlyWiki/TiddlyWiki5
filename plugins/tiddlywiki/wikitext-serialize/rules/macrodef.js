/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/macrodef.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "macrodef";

exports.serialize = function(tree,serialize) {
	var name = tree.attributes.name.value;
	var params = tree.params.map(function(param) {
			return param.name + (param.default ? ":" + param.default : "");
	}).join(",");
	var definition = tree.attributes.value.value;
	if(tree.isBlock) {
		return "\\define " + name + "(" + params + ") " + definition + "\n\n" + serialize(tree.children);
	}
	return "\\define " + name + "(" + params + ")\n" + definition + "\n\\end\n\n" + serialize(tree.children);
};
