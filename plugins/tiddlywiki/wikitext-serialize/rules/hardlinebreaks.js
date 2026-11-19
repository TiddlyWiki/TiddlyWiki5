/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/hardlinebreaks.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "hardlinebreaks";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	if(tree.type !== "void") {
		// Accept the old flat tree too, including a single node carrying both flags
		var text = tree.tag === "br" ? "\n" : (tree.text || "") + serialize(tree.children || []);
		if(tree.tag === "br" && options.source && typeof tree.start === "number" && typeof tree.end === "number") {
			var lineEnd = options.source.substring(tree.start,tree.end);
			if(/^\r?\n$/.test(lineEnd)) {
				text = lineEnd;
			}
		}
		return (tree.isRuleStart ? '"""\n' : "") + text + (tree.isRuleEnd ? '"""' : "");
	}
	// The source distinguishes inline, LF, CRLF and empty region openers
	var opener = '"""\n';
	if(options.source && typeof tree.start === "number") {
		var match = /^"""(?:\r?\n)?/.exec(options.source.substring(tree.start));
		if(match) {
			opener = match[0];
		}
	}
	return opener + serialize(tree.children) + '"""';
};
