/*\
title: $:/core/modules/filters/splitbefore.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.splitbefore = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var parts = title.split(operator.operand);
		if(parts.length === 1) {
			$tw.utils.pushTop(results,parts[0]);
		} else {
			$tw.utils.pushTop(results,parts[0] + operator.operand);
		}
	});
	return results;
};
