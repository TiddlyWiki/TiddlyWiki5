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
	const filter = tree.attributes.text.filter;
	// Variable mode produces: [(varname)join[sep]]
	const varMatch = /^\[\(([^()]+)\)join\[([^\]]*)\]\]$/.exec(filter);
	if(varMatch) {
		const [, varName, sep] = varMatch;
		return sep === ", " ? `((${varName}))` : `((${varName}||${sep}))`;
	}
	// Filter mode produces: originalFilter +[join[sep]]
	const filterMatch = /^([\s\S]*) \+\[join\[([^\]]*)\]\]$/.exec(filter);
	if(filterMatch) {
		const [, innerFilter, filterSep] = filterMatch;
		return filterSep === ", " ? `(((${innerFilter})))` : `(((${innerFilter}||${filterSep})))`;
	}
	// Fallback: should not occur in normal usage
	return `(((${filter})))`;
};
