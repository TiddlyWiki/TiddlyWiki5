/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/prettylink.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "prettylink";

exports.serialize = function(tree,serialize) {
	var text = tree.children[0].text;
	var target = tree.attributes.to ? tree.attributes.to.value : tree.attributes.href.value;
	return "[[" + text + (text !== target ? "|" + target : "") + "]]";
};
