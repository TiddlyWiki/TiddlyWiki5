/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/quoteblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "quoteblock";

exports.serialize = function (tree,serialize) {
	var result = [];
	if(tree.type === "element" && tree.tag === "blockquote") {
		// Exclude built-in tc-quote class; only emit user-defined classes
		var userClasses = (tree.attributes.class ? tree.attributes.class.value : "").split(" ").filter(function(c) {
			return c && c !== "tc-quote";
		});
		var classStr = userClasses.length > 0 ? userClasses.map(function(c) { return "." + c; }).join("") : "";
		// Separate opening cite, body, and closing cite
		var openCite = "", closeCite = "";
		var bodyChildren = [];
		tree.children.forEach(function (child) {
			if(child.type === "element" && child.tag === "cite") {
				if(bodyChildren.length === 0) {
					openCite = serialize(child.children).trim();
				} else {
					closeCite = serialize(child.children).trim();
				}
			} else {
				bodyChildren.push(child);
			}
		});
		result.push("<<<" + classStr + (openCite ? " " + openCite : ""));
		bodyChildren.forEach(function (child) {
			if(child.type === "element" && child.tag === "p") {
				result.push(serialize(child.children).trim());
			}
		});
		result.push("<<<" + (closeCite ? " " + closeCite : ""));
	}
	return result.join("\n") + "\n\n";
};
