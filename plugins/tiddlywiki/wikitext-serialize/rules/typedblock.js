/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/typedblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "typedblock";

exports.serialize = function (tree,serialize) {
	if(tree.type === "void") {
		return "$$$" + tree.parseType + (tree.renderType ? " > " + tree.renderType : "") + "\n" + tree.text + "\n$$$\n\n";
	}
	return "";
};
