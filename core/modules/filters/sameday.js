/*\
title: $:/core/modules/filters/sameday.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.sameday = function(source,operator,options) {
	var results = [],
		fieldName = operator.suffix || "modified",
		targetDate = (new Date($tw.utils.parseDate(operator.operand))).setHours(0,0,0,0);
	// Function to convert a date/time to a date integer
	source(function(tiddler,title) {
		if(tiddler) {
			if(tiddler.getFieldDay(fieldName) === targetDate) {
				results.push(title);
			}
		}
	});
	return results;
};
