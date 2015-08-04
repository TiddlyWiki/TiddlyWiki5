/*\
title: $:/core/modules/filters/days.js
type: application/javascript
module-type: filteroperator

Filter operator that selects tiddlers with a specified date field within a specified date interval.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

Math.sign = Math.sign || function(x) {
	x = +x; // convert to a number
	if (x === 0 || isNaN(x)) {
		return x;
	}
	return x > 0 ? 1 : -1;
};

/*
Export our filter function
*/
exports.days = function(source,operator,options) {
	var results = [],
		fieldName = operator.suffix || "modified",
		dayInterval = (parseInt(operator.operand,10)||0),
		dayIntervalSign = Math.sign(dayInterval),
		targetTimeStamp = (new Date()).setHours(0,0,0,0) + 1000*60*60*24*dayInterval,
		isWithinDays = function(dateField) {
			var sign = Math.sign(targetTimeStamp - (new Date(dateField)).setHours(0,0,0,0));
			return sign === 0 || sign === dayIntervalSign;
		};

	if(operator.prefix === "!") {
		source(function(tiddler,title) {
			if(tiddler && tiddler.fields[fieldName]) {
				if(!isWithinDays($tw.utils.parseDate(tiddler.fields[fieldName]))) {
					results.push(title);
				}
			}
		});
	} else {
		source(function(tiddler,title) {
			if(tiddler && tiddler.fields[fieldName]) {
				if(isWithinDays($tw.utils.parseDate(tiddler.fields[fieldName]))) {
					results.push(title);
				}
			}
		});
	}
	return results;
};

})();
