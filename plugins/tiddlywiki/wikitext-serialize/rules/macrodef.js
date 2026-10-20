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
	// Pragmas chain the rest of the tiddler as children; the separator is
	// not in the parse tree
	var gap = $tw.utils.recoverSourceGap(tree.end,tree.children[0] && tree.children[0].start,{source: options.source}) || "\n\n";
	if(slice !== null) {
		return slice + gap + $tw.utils.serializeChildren(tree,serialize,options);
	}
	var params = tree.params.map(function(param) {
		return param.name + (param.default ? ":" + $tw.utils.quoteParameterDefault(param.default,{allowBrackets: true}) : "");
	}).join(",");
	if(tree.isBlock) {
		return "\\define " + name + "(" + params + ") " + definition + "\n\n" + $tw.utils.serializeChildren(tree,serialize,options);
	}
	return "\\define " + name + "(" + params + ")\n" + definition + "\n\\end\n\n" + $tw.utils.serializeChildren(tree,serialize,options);
};
