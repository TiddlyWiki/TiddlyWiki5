/*\
title: $:/core/modules/filters/recent.js
type: application/javascript
module-type: filteroperator

Filter operator that selects tiddlers with a specified date field within the last N days.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.recent = function(source,operator,options) {
	var results = [],
		fieldName = operator.suffix || "modified",
		targetTimeStamp = (new Date()).setHours(0,0,0,0) - 1000*60*60*24*(parseInt(operator.operand,10)||0);
	var isRecent = function(dateField) {
			return targetTimeStamp <= (new Date(dateField)).setHours(0,0,0,0);
		};
	source(function(tiddler,title) {
		if(tiddler && tiddler.fields[fieldName]) {
			if(isRecent($tw.utils.parseDate(tiddler.fields[fieldName]))) {
				results.push(title);
			}
		}
	});
	return results;
};

})();
