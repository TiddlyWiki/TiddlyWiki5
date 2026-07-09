/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/fnprocdef.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "fnprocdef";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	var type = tree.isFunctionDefinition ? "function" : (tree.isProcedureDefinition ? "procedure" : "widget");
	var name = tree.attributes.name.value;
	var definition = tree.attributes.value.value;
	// The source slice preserves named \end markers, default quoting and the
	// single line form, none of which are recorded in the parse tree
	var slice = $tw.utils.serializeFromSource(tree,{source: options.source, fragments: [name,definition]});
	if(slice !== null) {
		return slice + "\n\n" + serialize(tree.children);
	}
	var params = tree.params.map(function(param) {
		if(param.defaultType === "multivalue-variable") {
			return param.name + ":((" + param.defaultVariable + "))";
		}
		if(param.default === undefined) {
			return param.name;
		}
		return param.name + ":" + $tw.utils.quoteParameterDefault(param.default);
	}).join(", ");
	// Concat the children because pragma rules wrap everything below them as children
	return "\\" + type + " " + name + "(" + params + ")\n" + definition + "\n\\end\n\n" + serialize(tree.children);
};
