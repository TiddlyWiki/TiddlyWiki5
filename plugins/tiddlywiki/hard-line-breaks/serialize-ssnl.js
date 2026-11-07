/*\
title: $:/plugins/tiddlywiki/hard-line-breaks/serialize-ssnl.js
type: application/javascript
module-type: wikiruleserializer

Serializes a break made by two spaces before the line end for the wikitext-serialize plugin

\*/

"use strict";

exports.name = "ssnl";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	// The source slice keeps a CRLF line end; a node built by an editor has no
	// marker, and the backslash form survives tools that trim trailing whitespace
	var slice = $tw.utils.serializeFromSource(tree,{source: options.source});
	return slice !== null ? slice : (tree.marker || "  \\") + "\n";
};
