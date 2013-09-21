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
		isSameDay = function(dateField,dateString) {
			var date1 = (new Date(dateField)).setHours(0,0,0,0),
				date2 = (new Date($tw.utils.parseDate(dateString))).setHours(0,0,0,0);
			return date1 === date2;
		};
	// Function to check an individual title
	function checkTiddler(title) {
		var tiddler = options.wiki.getTiddler(title);
		if(tiddler) {
			var match = isSameDay(tiddler.fields.modified,operator.operand);
			if(operator.prefix === "!") {
				match = !match;
			}
			if(match) {
				results.push(title);
			}
		}
	}
	// Iterate through the source tiddlers
	if($tw.utils.isArray(source)) {
		$tw.utils.each(source,function(title) {
			checkTiddler(title);
		});
	} else {
		$tw.utils.each(source,function(element,title) {
			checkTiddler(title);
		});
	}
	return results;
};

})();
