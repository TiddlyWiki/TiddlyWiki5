/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/whitespace.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "whitespace";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	var values = tree.attributes.values ? tree.attributes.values.value : "";
	// The source slice preserves the original token spacing
	var slice = $tw.utils.serializeFromSource(tree,{source: options.source, fragments: values ? values.split(" ") : []});
	var pragma = slice !== null ? slice : "\\whitespace " + values;
	// The separator is not in the parse tree: chained pragmas sit on adjacent
	// lines while body content follows after a blank line, so recover the
	// original gap from the source
	var gap = $tw.utils.recoverSourceGap(tree.end,tree.children[0] && tree.children[0].start,{source: options.source}) || "\n\n";
	return pragma + gap + serialize(tree.children);
};
