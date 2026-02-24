/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/import.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "import";

exports.serialize = function(tree,serialize) {
	var filter = tree.attributes.filter.value;
	// Sibling below the pragma become children, so we append the serialized children to the end..
	return "\\import " + filter + "\n" + serialize(tree.children);
};
