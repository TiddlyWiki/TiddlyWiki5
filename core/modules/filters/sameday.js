/*\
title: $:/core/modules/filters/sameday.js
type: application/javascript
module-type: filteroperator

Filter operator that selects tiddlers with a modified date field on the same day as the provided value.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.sameday = function(source,operator,options) {
	var results = [],
		fieldName = operator.suffix || "modified",
		targetDate = (new Date($tw.utils.parseDate(operator.operand))).setHours(0,0,0,0);
	// Function to convert a date/time to a date integer
	var isSameDay = function(dateField) {
			return (new Date(dateField)).setHours(0,0,0,0) === targetDate;
		};
	// Convert ISO date string to Date object if needed.
	var toDateObj = function(value) {
		if(!(value instanceof Date)) {
			value = new Date($tw.utils.parseDate(value));
		}
		return value;
	};
	source(function(tiddler,title) {
		if(tiddler && tiddler.fields[fieldName]) {
			if(isSameDay(toDateObj(tiddler.fields[fieldName]))) {
				results.push(title);
			}
		}
	});
	return results;
};

})();
