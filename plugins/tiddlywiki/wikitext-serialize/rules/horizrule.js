/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/horizrule.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "horizrule";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	// The source keeps the written dash count, e.g. -----; a tree without it gets three dashes
	var slice = $tw.utils.serializeFromSource(tree,{source: options.source, fragments: ["---"]});
	return slice !== null ? slice.replace(/\r?\n$/,"") : "---";
};
