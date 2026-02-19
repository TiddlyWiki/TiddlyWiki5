/*\
title: $:/core/modules/filters/then.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.then = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(operator.operand);
	});
	return results;
};
