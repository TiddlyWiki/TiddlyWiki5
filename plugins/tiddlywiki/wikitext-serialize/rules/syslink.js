/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/syslink.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "syslink";

exports.serialize = function(tree,serialize) {
	if(tree.attributes && tree.attributes.to) {
		return tree.attributes.to.value;
	}
	// A suppressed syslink is a plain text node; its span starts after the ~
	return "~" + tree.text;
};
