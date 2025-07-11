/*\
title: $:/core/modules/filters/days.js
type: application/javascript
module-type: filteroperator

Filter operator that selects tiddlers with a specified date field within a specified date interval.

\*/

"use strict";

/*
Export our filter function
*/
exports.days = function(source,operator,options) {
	const results = [];
	const fieldName = operator.suffix || "modified";
	const dayInterval = (parseInt(operator.operand,10) || 0);
	const dayIntervalSign = $tw.utils.sign(dayInterval);
	let targetTimeStamp = (new Date()).setHours(0,0,0,0) + 1000 * 60 * 60 * 24 * dayInterval;
	const isWithinDays = function(dateField) {
		const sign = $tw.utils.sign(targetTimeStamp - (new Date(dateField)).setHours(0,0,0,0));
		return sign === 0 || sign === dayIntervalSign;
	};

	if(operator.prefix === "!") {
		targetTimeStamp -= 1000 * 60 * 60 * 24 * dayIntervalSign;
		source((tiddler,title) => {
			if(tiddler && tiddler.fields[fieldName]) {
				if(!isWithinDays($tw.utils.parseDate(tiddler.fields[fieldName]))) {
					results.push(title);
				}
			}
		});
	} else {
		source((tiddler,title) => {
			if(tiddler && tiddler.fields[fieldName]) {
				if(isWithinDays($tw.utils.parseDate(tiddler.fields[fieldName]))) {
					results.push(title);
				}
			}
		});
	}
	return results;
};
