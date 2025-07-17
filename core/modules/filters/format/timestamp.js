/*\
title: $:/core/modules/filters/format/timestamp.js
type: application/javascript
module-type: formatfilteroperator
\*/

"use strict";

/*
Export our filter function
*/
exports.timestamp = function(source,operand,options) {
	const results = [];
	source((tiddler,title) => {
		if(title.match(/^-?\d+$/)) {
			const value = new Date(Number(title));
			results.push($tw.utils.formatDateString(value,operand || "[UTC]YYYY0MM0DD0hh0mm0ss0XXX"));
		}
	});
	return results;
};
