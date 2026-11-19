/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/codeinline.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "codeinline";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	var slice = $tw.utils.serializeFromSource(tree,{source: options.source});
	if(slice !== null) return slice;
	var text = serialize(tree.children);
	// Neither of the core's one-/two-backtick delimiters can hold a pair
	// inside the body or a backtick touching the closing delimiter. HTML code
	// with entities retains literal WikiText punctuation without invoking it.
	if(text.indexOf("``") !== -1 || text.slice(-1) === "`" || /[\r\n]/.test(text)) {
		return "<code>" + text.replace(/[^a-zA-Z0-9 ]/gu,function(character) {
			var code = character.codePointAt(0);
			return "&#" + (code < 10 ? "0" : "") + code + ";";
		}) + "</code>";
	}
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
