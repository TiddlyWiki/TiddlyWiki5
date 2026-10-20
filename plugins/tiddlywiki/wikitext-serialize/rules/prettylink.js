/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/prettylink.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "prettylink";

// The text of a bracket link when it is one plain text node, else null
exports.plainText = function(tree) {
	var children = tree.children || [];
	if(children.length === 0) {
		return "";
	}
	return children.length === 1 && children[0].type === "text" && !children[0].rule ? children[0].text : null;
};

exports.serialize = function(tree,serialize,options) {
	var target = tree.attributes.to ? tree.attributes.to.value : tree.attributes.href.value,
		text = exports.plainText(tree);
	// The bracket form holds plain text only; formatted text needs the widget
	if(text === null) {
		return "<$link " + $tw.utils.serializeAttribute({name: "to", type: "string", value: target},options) + ">" + serialize(tree.children) + "</$link>";
	}
	if(text === "") {
		text = target;
	}
	return "[[" + text + (text !== target ? "|" + target : "") + "]]";
};
