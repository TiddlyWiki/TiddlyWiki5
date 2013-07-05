/*\
title: $:/core/modules/filters/tagging.js
type: application/javascript
module-type: filteroperator

Filter operator returning all tiddlers that are tagged with the selected tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.tagging = function(source,operator,options) {
	var results = [];
	// Function to check an individual title
	function checkTiddler(title) {
		$tw.utils.pushTop(results,options.wiki.getTiddlersWithTag(title));
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
