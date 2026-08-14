/*\
title: $:/core/modules/filters/parsedate.js
type: application/javascript
module-type: filteroperator

Filter operator converting different date formats into TiddlyWiki's date format

\*/

"use strict";

const INPUT_FORMATS = new Set(["JS","TW","UNIXTIME","NUMBER","AUTO"]);

const isValidDate = (date) => Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date.valueOf());

/*
Export our filter function
*/
exports.parsedate = (source, operator) => {
	const inputFormat = (operator.operand || "JS").toUpperCase();
	if(!INPUT_FORMATS.has(inputFormat)) {
		return [$tw.language.getString("Error/ParseDateFilterOperator")];
	}
	const results = [];
	source((tiddler,title) => {
		const date = $tw.utils.parseDate(title,inputFormat);
		if(isValidDate(date)) {
			results.push($tw.utils.stringifyDate(date));
		}
	});
	return results;
};
