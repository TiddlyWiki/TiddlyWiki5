/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/hardlinebreaks.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "hardlinebreaks";

exports.serialize = function(tree,serialize) {
	var text = tree.tag === "br" ? "\n" : (tree.text || "");
	if(tree.isRuleStart) {
		return '"""\n' + text;
	}
	if(tree.isRuleEnd) {
		return text + '"""';
	}
	return text + serialize(tree.children);
};
