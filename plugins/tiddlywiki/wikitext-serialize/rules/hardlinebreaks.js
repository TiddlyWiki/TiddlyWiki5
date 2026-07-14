/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/hardlinebreaks.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "hardlinebreaks";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	// A br the parser inserted for a line break inside the region
	if(tree.tag === "br") {
		return "\n";
	}
	// The region can open inline ("""text) or with a line break; only the source knows which
	var opener = '"""\n',
		first = tree.children && tree.children[0];
	if(options.source && typeof tree.start === "number" && first && typeof first.start === "number" && first.start > tree.start) {
		var slice = options.source.substring(tree.start,first.start);
		if(/^"""\s*$/.test(slice)) {
			opener = slice;
		}
	}
	return opener + serialize(tree.children) + '"""';
};
