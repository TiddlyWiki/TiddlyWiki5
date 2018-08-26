/*\
title: $:/core/modules/filters/getstoryviewsingletiddlermode.js
type: application/javascript
module-type: filteroperator

Filter operator for retrieving the single tiddler mode status of a storyview.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter functions
*/

exports.getstoryviewsingletiddlermode = function(source,operator,options) {
	// Initialise the storyviews if they've not been done already
	var storyviews = {};
	$tw.modules.applyMethods("storyview",storyviews);
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
