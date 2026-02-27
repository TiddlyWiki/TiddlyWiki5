/*\
title: $:/core/modules/filters/before.js
type: application/javascript
module-type: filteroperator

Filter operator returning the tiddler from the current list that is before the tiddler named in the operand.

\*/

"use strict";

/*
Export our filter function
*/
exports.before = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(title);
	});
	var index = results.indexOf(operator.operand);
	if(index <= 0) {
		return [];
	} else {
		return [results[index - 1]];
	}
};
