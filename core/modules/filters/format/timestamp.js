/*\
title: $:/core/modules/filters/format/timestamp.js
type: application/javascript
module-type: formatfilteroperator
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.timestamp = function(source,operand,options) {
	var results = [];
	source(function(tiddler,title) {
		if (title.match(/^-?\d+$/)) {
			var value = new Date(Number(title));
			results.push($tw.utils.formatDateString(value,operand || "[UTC]YYYY0MM0DD0hh0mm0ss0XXX"));
		}
	});
	return results;
};
})();