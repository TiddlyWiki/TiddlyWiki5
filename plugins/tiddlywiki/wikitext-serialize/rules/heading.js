/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/heading.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "heading";

exports.serialize = function(tree,serialize) {
	// Get heading level from number after `h`
	var headingLevel = parseInt(tree.tag.substr(1),10);
	var classes = tree.attributes.class ? tree.attributes.class.value.split(" ").join(".") : "";
	var headingText = serialize(tree.children);
	return Array(headingLevel + 1).join("!") + (classes ? "." + classes : "") + " " + headingText + "\n\n";
};
