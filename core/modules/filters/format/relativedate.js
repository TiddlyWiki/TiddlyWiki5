/*\
title: $:/core/modules/filters/format/relativedate.js
type: application/javascript
module-type: formatfilteroperator
\*/

"use strict";

/*
Export our filter function
*/
exports.relativedate = function(source,operand,options) {
	var results = [];
	source(function(tiddler,title) {
		var value = $tw.utils.parseDate(title);
		if(value && $tw.utils.isDate(value) && value.toString() !== "Invalid Date") {
			results.push($tw.utils.getRelativeDate((new Date()) - (new Date(value))).description);
		}
	});
	return results;
};
