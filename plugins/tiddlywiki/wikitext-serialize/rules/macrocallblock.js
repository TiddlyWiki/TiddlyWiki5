/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/macrocallblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "macrocallblock";

exports.serialize = function (node) {
	var result = "<<";
	// Macro name
	if(node.attributes && node.attributes["$variable"]) {
		result += node.attributes["$variable"].value;
	}
	// Append ordered arguments if any
	if(node.orderedAttributes) {
		node.orderedAttributes.forEach(function (attribute) {
			if(attribute.name !== "$variable") {
				result += " " + $tw.utils.serializeAttribute(attribute,{assignmentSymbol:":"});
			}
		});
	}
	result += ">>\n\n";
	return result;
};
