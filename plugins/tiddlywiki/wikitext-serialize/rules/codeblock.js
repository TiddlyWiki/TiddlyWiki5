/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/codeblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "codeblock";

exports.serialize = function(tree,serialize) {
	return "```" + tree.attributes.language.value + "\n" + tree.attributes.code.value + "\n```\n\n";
};
