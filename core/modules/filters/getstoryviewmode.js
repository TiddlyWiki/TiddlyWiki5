/*\
title: $:/core/modules/filters/getstoryviewmode.js
type: application/javascript
module-type: filteroperator

Filter operator for retrieving modes from a storyview. Only "singletiddlermode" is implemented at present

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter functions
*/

exports.getstoryviewmode = function(source,operator,options) {
	// Initialise the storyviews if they've not been done already
	var storyviews = {};
	$tw.modules.applyMethods("storyview",storyviews);
	if(operator.operand !== "singletiddlermode") {
		return [];
	}
	var results = [];
	source(function(tiddler,title) {
		var storyview = storyviews[title];
		if(storyview && storyview.singleTiddlerMode) {
			results.push("yes");			
		} else {
			results.push("no");
		}
	});
	return results;
};

})();
