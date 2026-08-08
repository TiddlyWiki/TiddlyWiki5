/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/macrocallblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "macrocallblock";

exports.serialize = function (node,serialize,options) {
	options = options || {};
	// The slice preserves the author's parameter layout, e.g. <<test"Hello">>
	// without a separating space; a mutated name or value forfeits it
	var fragments = [];
	if(node.attributes && node.attributes["$variable"]) {
		fragments.push(node.attributes["$variable"].value);
	}
	if(node.orderedAttributes) {
		node.orderedAttributes.forEach(function (attribute) {
			if(attribute.name !== "$variable" && attribute.type === "string") {
				fragments.push(attribute.value);
			}
		});
	}
	var slice = $tw.utils.serializeFromSource(node,{source: options.source, fragments: fragments});
	if(slice !== null) {
		return slice;
	}
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
	result += ">>";
	return result;
};
