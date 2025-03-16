/*\
title: $:/core/modules/filters/else.js
type: application/javascript
module-type: filteroperator

Filter operator for replacing an empty input list with a constant, passing a non-empty input list straight through

\*/

"use strict";

/*
Export our filter function
*/
exports.else = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(title);
	});
	if(results.length === 0) {
		return [operator.operand];
	} else {
		return results;
	}
};
