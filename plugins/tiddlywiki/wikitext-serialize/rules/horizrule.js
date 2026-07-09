/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/horizrule.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "horizrule";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	// The span includes the line end the block rule consumed; keep it, but
	// the dash count stays normalized by choice
	var tail = "";
	if(options.source && typeof tree.start === "number" && typeof tree.end === "number") {
		var match = /\s+$/.exec(options.source.substring(tree.start,tree.end));
		if(match) {
			tail = match[0];
		}
	}
	return "---" + tail + "\n\n";
};
