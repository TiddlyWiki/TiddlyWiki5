/*\
title: $:/core/modules/filters/eachday.js
type: application/javascript
module-type: filteroperator

Filter operator that selects one tiddler for each unique day covered by the specified date field

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.eachday = function(source,operator,options) {
	// Function to convert a date/time to a date integer
	var toDate = function(value) {
		value = (new Date(value)).setHours(0,0,0,0);
		return value+0;
	};
	// Convert the source to an array if necessary
	if(!$tw.utils.isArray(source)) {
		var copy = [];
		$tw.utils.each(source,function(element,title) {
			copy.push(title);
		});
		source = copy;
	}
	// Collect up the first tiddler with each unique day value of the specified field
	var results = [],values = [];
	$tw.utils.each(source,function(title) {
		var tiddler = options.wiki.getTiddler(title);
		if(tiddler && tiddler.fields[operator.operand]) {
			var value = toDate(tiddler.fields[operator.operand]);
			if(values.indexOf(value) === -1) {
				values.push(value);
				results.push(title);
			}
		}
	});
	return results;
};

})();
