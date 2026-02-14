/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/wikilink.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "wikilink";

exports.serialize = function(tree,serialize) {
	var isSuppressed = tree.children && tree.children[0].text.substr(0,1) === $tw.config.textPrimitives.unWikiLink;

	var serialized = isSuppressed ? $tw.config.textPrimitives.unWikiLink : "";
	serialized += tree.attributes ? tree.attributes.to.value : tree.text;
	return serialized;
};
