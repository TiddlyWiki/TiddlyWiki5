/*\
title: $:/core/modules/filters/after.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.after = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(title);
	});
	var index = results.indexOf(operator.operand);
	if(index === -1 || index > (results.length - 2)) {
		return [];
	} else {
		return [results[index + 1]];
	}
};
