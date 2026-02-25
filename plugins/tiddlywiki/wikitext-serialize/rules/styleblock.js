/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/styleblock.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "styleblock";

exports.serialize = function(tree,serialize) {
	var lines = [];
	var classes = [];
	var styles = [];

	// Same classes are set to each children. So only collect from first child.
	var node = tree.children[0];
	if(node && node.attributes && node.attributes.class) {
		var nodeClasses = node.attributes.class.value.split(" ");
		for(var j = 0; j < nodeClasses.length; j++) {
			if(classes.indexOf(nodeClasses[j]) === -1) {
				classes.push(nodeClasses[j]);
			}
		}
	}
	if(node && node.attributes && node.attributes.style) {
		var nodeStyles = node.attributes.style.value.split(";");
		for(var k = 0; k < nodeStyles.length; k++) {
			var style = nodeStyles[k].trim();
			if(style && styles.indexOf(style) === -1) {
				styles.push(style);
			}
		}
	}

	// Add the style block header, sort styles first, and classes later. Original order is not preserved intentionally for simplicity.
	if(classes.length > 0 || styles.length > 0) {
		if(styles.length > 0) {
			lines.push("@@");
			lines.push(styles.join(";"));
			lines.push(";\n");
		}
		if(classes.length > 0) {
			lines.push("@@.");
			lines.push(classes.join("."));
			lines.push("\n");
		}
	}
	// Serialize each child node and add to result
	for(var i = 0; i < tree.children.length; i++) {
		lines.push(serialize(tree.children[i]));
	}
	var result = lines.join("").replace(/\s+$/, "");
	// Add the closing @@ for the style block
	result += "\n@@\n\n";
	return result;
};
