/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/codeinline.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "codeinline";

exports.serialize = function(tree,serialize) {
	var text = serialize(tree.children),
		// Backticks inside and empty text need double delimiters, eg: ``a`b``
		delimiter = (text === "" || text.indexOf("`") !== -1) ? "``" : "`";
	return delimiter + text + delimiter;
};
