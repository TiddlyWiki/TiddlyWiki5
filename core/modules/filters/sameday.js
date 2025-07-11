/*\
title: $:/core/modules/filters/sameday.js
type: application/javascript
module-type: filteroperator

Filter operator that selects tiddlers with a modified date field on the same day as the provided value.

\*/

"use strict";

/*
Export our filter function
*/
exports.sameday = function(source,operator,options) {
	const results = [];
	const fieldName = operator.suffix || "modified";
	const targetDate = (new Date($tw.utils.parseDate(operator.operand))).setHours(0,0,0,0);
	// Function to convert a date/time to a date integer
	source((tiddler,title) => {
		if(tiddler) {
			if(tiddler.getFieldDay(fieldName) === targetDate) {
				results.push(title);
			}
		}
	});
	return results;
};
