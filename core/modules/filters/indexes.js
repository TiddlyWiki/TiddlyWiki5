/*\
title: $:/core/modules/filters/indexes.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the indexes of a data tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.indexes = function(source,operator,options) {
	var self = this,
		results = [];
	// Function to check an individual title
	function checkTiddler(title) {
		// Return the fields on the specified tiddler
		var data = options.wiki.getTiddlerData(title,{});
		if(data) {
			$tw.utils.pushTop(results,Object.keys(data));
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
	results.sort();
	return results;
};

})();
