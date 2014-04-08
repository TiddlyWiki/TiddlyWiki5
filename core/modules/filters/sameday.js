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
		targetDate = (new Date($tw.utils.parseDate(operator.operand))).setHours(0,0,0,0);
	// Function to convert a date/time to a date integer
	var isSameDay = function(dateField) {
			return (new Date(dateField)).setHours(0,0,0,0) === targetDate;
		};
	source(function(tiddler,title) {
		if(tiddler && tiddler.fields.modified) {
			if(isSameDay(tiddler.fields.modified)) {
				results.push(title);
			}
		}
	});
	return results;
};

})();
