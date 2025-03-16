/*\
title: $:/core/modules/filters/format/date.js
type: application/javascript
module-type: formatfilteroperator
\*/

"use strict";

/*
Export our filter function
*/
exports.date = function(source,operand,options) {
	var results = [];
	source(function(tiddler,title) {
		var value = $tw.utils.parseDate(title);
		if(value && $tw.utils.isDate(value) && value.toString() !== "Invalid Date") {
			results.push($tw.utils.formatDateString(value,operand || "YYYY MM DD 0hh:0mm"));
		}
	});
	return results;
};
