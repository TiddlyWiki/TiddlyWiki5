/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/emphasis/italic.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "italic";

exports.serialize = function(tree,serialize) {
	return "//" + serialize(tree.children) + "//";
};
