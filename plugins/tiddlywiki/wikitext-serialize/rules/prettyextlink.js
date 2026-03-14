/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/prettyextlink.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "prettyextlink";

exports.serialize = function(tree,serialize) {
	var tooltip = tree.children[0].text;
	var url = tree.attributes.href.value;
	return "[ext[" + (tooltip !== url ? tooltip + "|" : "") + url + "]]";
};
