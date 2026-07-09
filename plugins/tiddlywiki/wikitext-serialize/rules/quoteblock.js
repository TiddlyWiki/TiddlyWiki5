/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/quoteblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "quoteblock";

function isQuoteCite(node) {
	return !!(node && (node.isQuoteCite || (node.tag === "cite" && !node.rule)));
}

function serializeFromTree(tree,serialize) {
	// The first class in the class attribute is always the synthesized tc-quote
	var marker = tree.marker || "<<<",
		classes = tree.userClasses || (tree.attributes.class ? tree.attributes.class.value.split(" ").slice(1) : []),
		classText = classes.map(function(c) { return "." + c; }).join(""),
		children = tree.children ? tree.children.slice() : [],
		openingCite = "",
		closingCite = "";
	if(isQuoteCite(children[0])) {
		openingCite = " " + serialize(children.shift().children);
	}
	if(children.length && isQuoteCite(children[children.length - 1])) {
		closingCite = " " + serialize(children.pop().children);
	}
	var body = "";
	$tw.utils.each(children,function(child) {
		body += serialize(child);
	});
	return marker + classText + openingCite + "\n" + body.replace(/\n+$/,"") + "\n" + marker + closingCite;
}

exports.serialize = function(tree,serialize,options) {
	options = options || {};
	// Marker depth (<<< vs <<<<) and the class list only exist in the source
	var result = $tw.utils.serializeStitched(tree,serialize,{
		source: options.source,
		isBoundary: function(text) {
			return /^\s*$/.test(text) || text.indexOf("<<<") !== -1;
		}
	});
	if(result === null) {
		result = serializeFromTree(tree,serialize);
	}
	return result + "\n\n";
};
