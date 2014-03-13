/*\
title: $:/core/modules/filters/removeprefix.js
type: application/javascript
module-type: filteroperator

Filter operator for removing a prefix from each title in the list. Titles that do not start with the prefix are removed.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.removeprefix = function(source,operator,options) {
	var results = [];
	// Function to check an individual title
	function checkTiddler(title) {
		var match = title.substr(0,operator.operand.length).toLowerCase() === operator.operand.toLowerCase();
		if(match) {
			results.push(title.substr(operator.operand.length));
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
