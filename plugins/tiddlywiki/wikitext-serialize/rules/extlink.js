/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/extlink.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "extlink";

exports.serialize = function(tree,serialize) {
	if(tree.type === "text") {
			return "~" + tree.text;
	} else if(tree.type === "element" && tree.tag === "a") {
			return tree.attributes.href.value;
	}
};
