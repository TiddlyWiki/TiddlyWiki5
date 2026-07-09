/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/codeblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "codeblock";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	// The node span includes the line end the block rule consumed, which
	// the tree does not record; the slice keeps the emission span exact
	var slice = $tw.utils.serializeFromSource(tree,{source: options.source, fragments: [tree.attributes.code.value]});
	if(slice !== null) {
		return slice + "\n\n";
	}
	return "```" + tree.attributes.language.value + "\n" + tree.attributes.code.value + "\n```\n\n";
};
