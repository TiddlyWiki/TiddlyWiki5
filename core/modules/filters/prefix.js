/*\
title: $:/core/modules/filters/prefix.js
type: application/javascript
module-type: filteroperator

Filter operator for checking if a title starts with a prefix

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.prefix = function(source,operator,options) {
	var results = [];
	// Function to check an individual title
	function checkTiddler(title) {
		var match = title.substr(0,operator.operand.length).toLowerCase() === operator.operand.toLowerCase();
		if(operator.prefix === "!") {
			match = !match;
		}
		if(match) {
			results.push(title);
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
