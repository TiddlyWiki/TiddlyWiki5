/*\
title: $:/core/modules/filters/insertbefore.js
type: application/javascript
module-type: filteroperator

Insert an item before another item in a list

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Order a list
*/
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
		// Insert the entry before the target marker
		pos = results.indexOf(target);
		if(pos !== -1) {
			results.splice(pos,0,operator.operand);
		} else {
			results.push(operator.operand);
		}
	}
	return results;
};

})();
