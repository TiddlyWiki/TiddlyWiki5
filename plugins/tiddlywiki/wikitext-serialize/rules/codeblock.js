/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/codeblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "codeblock";

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	// The node span includes the line end the block rule consumed, which
	// the tree does not record; the slice keeps the emission span exact
	var slice = $tw.utils.serializeFromSource(tree,{source: options.source, fragments: [tree.attributes.code.value]});
	if(slice !== null) {
		return slice;
	}
	var code = tree.attributes.code.value,
		language = tree.attributes.language.value;
	// The core fence grammar has a fixed three-backtick closing line and
	// accepts only word characters and hyphens in the language. The standard
	// codeblock widget can carry code outside those limits without changing it.
	if(/(^|\n)```\r?(\n|$)/.test(code) || !/^[\w-]*$/.test(language)) {
		return "<$codeblock " + literalAttribute("code",code) + " " + literalAttribute("language",language) + "/>\n";
	}
	return "```" + language + "\n" + code + "\n```";
};

function literalAttribute(name,value) {
	var text = $tw.utils.serializeAttribute({name: name, type: "string", value: value}),
		parsed = $tw.utils.parseAttribute(text,0);
	if(parsed && parsed.end === text.length && parsed.type === "string" && parsed.value === value) {
		return text;
	}
	// A value containing every quote form uses a constant core filter. Base64
	// keeps source text out of filter syntax and round-trips Unicode as UTF-8.
	return name + "={{{[[" + $tw.utils.base64Encode(value) + "]decodebase64[]]}}}";
}
