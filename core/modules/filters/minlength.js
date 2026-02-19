/*\
title: $:/core/modules/filters/minlength.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.minlength = function(source,operator,options) {
	var results = [],
		minLength = parseInt(operator.operand || "",10) || 0;
	source(function(tiddler,title) {
		if(title.length >= minLength) {
			results.push(title);
		}
	});
	return results;
};
