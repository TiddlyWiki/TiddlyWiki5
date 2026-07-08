/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/macrocallblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "macrocallblock";

exports.serialize = function (node,serialize,options) {
	var result = "<<";
	// Macro name
	if(node.attributes && node.attributes["$variable"]) {
		result += node.attributes["$variable"].value;
	}
	// Append ordered arguments if any
	if(node.orderedAttributes) {
		node.orderedAttributes.forEach(function (attribute) {
			if(attribute.name !== "$variable") {
				result += " " + $tw.utils.serializeAttribute(attribute,options);
			}
		});
	}
	// A parameter ending in '>' needs a space before the closing marker,
	// otherwise the reparse would end the call early
	if(result.charAt(result.length - 1) === ">") {
		result += " ";
	}
	result += ">>\n\n";
	return result;
};
