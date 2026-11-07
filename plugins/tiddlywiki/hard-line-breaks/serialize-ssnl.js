/*\
title: $:/plugins/tiddlywiki/hard-line-breaks/serialize-ssnl.js
type: application/javascript
module-type: wikiruleserializer

Serializes a break made by two spaces before the line end for the wikitext-serialize plugin

\*/

"use strict";

exports.name = "ssnl";

exports.serialize = function(tree) {
	// A node built by an editor has no marker; the backslash form survives tools that trim trailing whitespace
	return (tree.marker || "  \\") + "\n";
};
