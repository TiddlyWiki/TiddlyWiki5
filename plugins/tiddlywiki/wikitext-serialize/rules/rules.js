/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/rules.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "rules";

exports.serialize = function (tree,serialize) {
	var result = [];
	if(tree.attributes.action && tree.attributes.rules) {
		// tree.attributes.action.value: "except"
		// tree.attributes.rules.value: "ruleone ruletwo rulethree"
		result.push("\\rules " + tree.attributes.action.value + " " + tree.attributes.rules.value);
		tree.children.forEach(function (child) {
			if(child.type === "void" && child.attributes.action && child.attributes.rules) {
				// child.attributes.action.value: "only"
				// child.attributes.rules.value: "ruleone ruletwo rulethree"
				result.push("\\rules " + child.attributes.action.value + " " + child.attributes.rules.value);
			}
		});
	}
	return result.join("\n");
};
