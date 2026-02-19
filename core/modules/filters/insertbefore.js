/*\
title: $:/core/modules/filters/insertbefore.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.insertbefore = function(source,operator,options) {
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

		pos = results.indexOf(target);
		if(pos !== -1) {
			results.splice(pos,0,operator.operand);
		} else {
			var suffix = operator.operands.length > 1 ? operator.suffix : "";
			if(suffix == "start") {
				results.splice(0,0,operator.operand);
			} else {
				results.push(operator.operand);
			}
		}
	}
	return results;
};
