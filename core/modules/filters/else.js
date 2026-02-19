/*\
title: $:/core/modules/filters/else.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

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
