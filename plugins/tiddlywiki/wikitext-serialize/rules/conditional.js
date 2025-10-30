/*\
title: $:/plugins/tiddlywiki/wikitext-serialize/rules/conditional.js
type: application/javascript
module-type: wikiruleserializer
\*/

"use strict";

exports.name = "conditional";

exports.serialize = function(tree,serialize) {
	// We always have "if" at the beginning
	var filterCondition = tree.attributes.filter.value;
	var ifClauseText = serialize(tree.children[0].children);
	var result = "<%if " + filterCondition + "%>" + ifClauseText;
	function serializeElseIf(listNode) {
		// We receive the only list node inside list-template node
		if(!listNode || listNode.type !== "list") {
			return "<%else%>" + serialize(listNode);
		}
		var filter = listNode.attributes.filter.value || "";
		var bodyText = serialize(listNode.children[0].children);
		var nextConditionResult = "";
		// May has an only any node inside list-empty node
		if(listNode.children[1] && listNode.children[1].children[0]) {
			if(listNode.children[1].children[0].type === "list") {
				nextConditionResult = serializeElseIf(listNode.children[1].children[0]);
			} else {
				nextConditionResult = "<%else%>" + serialize(listNode.children[1]);
			}
		}
		return "<%elseif " + filter + "%>" + bodyText + nextConditionResult;
	}
	if(tree.children[1] && tree.children[1].children) {
		result += serializeElseIf(tree.children[1].children[0]);
	}
	result += "<%endif%>";
	if(tree.isBlock) {
		result += "\n\n";
	}
	return result;
};
