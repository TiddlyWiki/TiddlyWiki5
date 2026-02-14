/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/syslink.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "syslink";

exports.serialize = function(tree,serialize) {
	// Check if the link is suppressed. Tree may only have text, no children and attributes
	var isSuppressed = tree.children && tree.children[0].text.substr(0,1) === "~";
	var serialized = isSuppressed ? "~" : "";
	// Append the link text
	serialized += tree.attributes ? tree.attributes.to.value : tree.text;
	return serialized;
};
