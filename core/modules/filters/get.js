/*\
title: $:/core/modules/filters/get.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.get = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(tiddler) {
			var value = tiddler.getFieldString(operator.operand);
			if(value) {
				results.push(value);
			}
		}
	});
	return results;
};
