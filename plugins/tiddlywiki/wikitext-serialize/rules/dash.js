/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/dash.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "dash";

exports.serialize = function(tree,serialize) {
	return tree.entity === "&ndash;" ? "--" : "---";
};
