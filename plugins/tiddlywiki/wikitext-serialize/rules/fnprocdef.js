/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/fnprocdef.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "fnprocdef";

exports.serialize = function(tree,serialize) {
	// Type of definition: "function", "procedure", or "widget"
	var type = tree.isFunctionDefinition ? "function" : (tree.isProcedureDefinition ? "procedure" : "widget");
	// Name of the function, procedure, or widget
	var name = tree.attributes.name.value;
	// Parameters with default values
	var params = tree.params.map(function(param) {
			return param.name + (param.default ? ':"' + param.default + '"' : "");
	}).join(", ");
	// Definition text
	var definition = tree.attributes.value.value;
	// Construct the serialized string, concat the children because pragma rule wrap everything below it as children
	return "\\" + type + " " + name + "(" + params + ")\n" + definition + "\n\\end\n\n" + serialize(tree.children) + "\n";
};
