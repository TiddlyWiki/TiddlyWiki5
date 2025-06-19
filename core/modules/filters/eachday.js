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
	var results = [],
		values = [],
		fieldName = operator.operand || "modified";
	// Function to convert a date/time to a date integer
	var toDate = function(value) {
		value = (new Date(value)).setHours(0,0,0,0);
		return value+0;
	};
	source(function(tiddler,title) {
		if(tiddler && tiddler.fields[fieldName]) {
			var value = toDate($tw.utils.parseDate(tiddler.fields[fieldName]));
			if(values.indexOf(value) === -1) {
				values.push(value);
				results.push(title);
			}
		}
	});
	return results;
};
