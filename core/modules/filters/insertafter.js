/*\
title: $:/core/modules/filters/insertafter.js
type: application/javascript
module-type: filteroperator

Insert an item after another item in a list

\*/

"use strict";

/*
Order a list
*/
exports.insertafter = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(title);
	});
	var target = operator.operands[1] || (options.widget && options.widget.getVariable(operator.suffix || "currentTiddler"));
	if(target !== operator.operand) {
		// Remove the entry from the list if it is present
		var pos = results.indexOf(operator.operand);
		if(pos !== -1) {
			results.splice(pos,1);
		}
		// Insert the entry after the target marker
		pos = results.indexOf(target);
		if(pos !== -1) {
			results.splice(pos+1,0,operator.operand);
		} else {
			var suffix = operator.operands.length > 1 ? operator.suffix : "";
			if(suffix === "start") {
				results.splice(0,0,operator.operand);
			} else {
				results.push(operator.operand);
			}
		}
	}
	return results;
};
