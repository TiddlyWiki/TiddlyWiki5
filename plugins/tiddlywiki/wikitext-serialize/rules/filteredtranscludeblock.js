/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/filteredtranscludeblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "filteredtranscludeblock";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	// The node span includes the line end the block rule consumed, which
	// the tree does not record; the slice keeps the emission span exact
	var slice = $tw.utils.serializeFromSource(tree,{source: options.source, fragments: [tree.attributes.filter.value]});
	if(slice !== null) {
		return slice;
	}
	var serialized = "{{{" + tree.attributes.filter.value;
	// Tooltip text
	if(tree.attributes.tooltip) serialized += "|" + tree.attributes.tooltip.value;
	// Template title
	if(tree.attributes.template) serialized += "||" + tree.attributes.template.value;
	serialized += "}}";
	// Inline styles
	if(tree.attributes.style) serialized += tree.attributes.style.value;
	serialized += "}";
	// CSS classes
	if(tree.attributes.itemClass) serialized += "." + tree.attributes.itemClass.value.split(" ").join(".");
	return serialized;
};
