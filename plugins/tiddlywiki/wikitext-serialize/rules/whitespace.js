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
	var gap = "\n\n";
	if(options.source && typeof tree.end === "number" && tree.children.length && typeof tree.children[0].start === "number") {
		var sourceGap = options.source.substring(tree.end,tree.children[0].start);
		if(/^\s+$/.test(sourceGap)) {
			gap = sourceGap;
		}
	}
	return pragma + gap + serialize(tree.children);
};
