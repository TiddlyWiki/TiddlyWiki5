/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/mvvdisplayinline.js
type: application/javascript
module-type: wikiruleserializer

Serializer for the mvvdisplayinline rule.

Variable display: ((varname)) or ((varname||separator))
Filter display: (((filter))) or (((filter||separator)))

The default separator is ", " (comma space).

\*/

"use strict";

exports.name = "mvvdisplayinline";

exports.serialize = function(tree, serialize) {
	var filter = tree.attributes.text.filter;
	// Variable mode produces: [(varname)join[sep]]
	var varMatch = /^\[\(([^()]+)\)join\[([^\]]*)\]\]$/.exec(filter);
	if(varMatch) {
		var varName = varMatch[1];
		var sep = varMatch[2];
		if(sep === ", ") {
			return "((" + varName + "))";
		} else {
			return "((" + varName + "||" + sep + "))";
		}
	}
	// Filter mode produces: originalFilter +[join[sep]]
	var filterMatch = /^([\s\S]*) \+\[join\[([^\]]*)\]\]$/.exec(filter);
	if(filterMatch) {
		var innerFilter = filterMatch[1];
		var filterSep = filterMatch[2];
		if(filterSep === ", ") {
			return "(((" + innerFilter + ")))";
		} else {
			return "(((" + innerFilter + "||" + filterSep + ")))";
		}
	}
	// Fallback: should not occur in normal usage
	return "(((" + filter + ")))";
};
