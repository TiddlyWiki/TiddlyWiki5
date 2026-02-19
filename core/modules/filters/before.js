/*\
title: $:/core/modules/filters/before.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

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
