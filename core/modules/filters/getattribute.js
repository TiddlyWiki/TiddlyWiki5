/*\
title: $:/core/modules/filters/getattribute.js
type: application/javascript
module-type: filteroperator

Filter operator for retrieving attribute values from a widget, HTML element or macro invocation

\*/

"use strict";

/*
Parse the text as inline wikitext, returning the parse tree node of the single widget, element or
macro invocation that it consists of, or null if it consists of anything else. Whitespace either
side of the invocation is ignored
*/
function parseInvocation(wiki,text) {
	// Quick check to avoid parsing text that cannot contain an invocation
	if(!text || (text.indexOf("<") === -1 && text.indexOf("((") === -1)) {
		return null;
	}
	var parseTreeNodes = wiki.parseText("text/vnd.tiddlywiki",text,{parseAsInline: true}).tree,
		invocation = null;
	for(var t=0; t<parseTreeNodes.length; t++) {
		var parseTreeNode = parseTreeNodes[t];
		if(parseTreeNode.type === "text") {
			// Text either side of the invocation is only permitted if it is whitespace
			if(parseTreeNode.text.trim() !== "") {
				return null;
			}
		} else if(invocation) {
			// A second invocation means that the text isn't a single invocation
			return null;
		} else {
			invocation = parseTreeNode;
		}
	}
	return (invocation && invocation.attributes) ? invocation : null;
}

/*
Export our filter function
*/
exports.getattribute = function(source,operator,options) {
	var results = [],
		attributeNames = operator.operands;
	source(function(tiddler,title) {
		var invocation = parseInvocation(options.wiki,title);
		if(invocation) {
			for(var t=0; t<attributeNames.length; t++) {
				var attribute = invocation.attributes[attributeNames[t]];
				// Only attributes with a literal value can be resolved without evaluating the invocation
				if(attribute && attribute.type === "string") {
					results.push(attribute.value);
					return;
				}
			}
		}
	});
	return results;
};
