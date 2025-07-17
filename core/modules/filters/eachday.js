/*\
title: $:/core/modules/filters/eachday.js
type: application/javascript
module-type: filteroperator

Filter operator that selects one tiddler for each unique day covered by the specified date field

\*/

"use strict";

/*
Export our filter function
*/
exports.eachday = function(source,operator,options) {
	const results = [];
	const values = [];
	const fieldName = operator.operand || "modified";
	// Function to convert a date/time to a date integer
	const toDate = function(value) {
		value = (new Date(value)).setHours(0,0,0,0);
		return value + 0;
	};
	source((tiddler,title) => {
		if(tiddler && tiddler.fields[fieldName]) {
			const value = toDate($tw.utils.parseDate(tiddler.fields[fieldName]));
			if(!values.includes(value)) {
				values.push(value);
				results.push(title);
			}
		}
	});
	return results;
};
