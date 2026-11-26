/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/codeinline.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "codeinline";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	var text = serialize(tree.children);
	// The delimiter is not recorded in the tree; read it from the source,
	// falling back to double backticks when the text contains a backtick
	var delimiter = null;
	if(options.source && typeof tree.start === "number" && options.source.substr(tree.start,2) === "``") {
		delimiter = "``";
	}
	if(!delimiter) {
		// Backticks inside and empty text need double delimiters, eg: ``a`b``
		delimiter = (text === "" || text.indexOf("`") !== -1) ? "``" : "`";
	}
	return delimiter + text + delimiter;
};
