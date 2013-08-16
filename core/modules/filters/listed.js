/*\
title: $:/core/modules/filters/listed.js
type: application/javascript
module-type: filteroperator

Filter operator returning all tiddlers that have the selected tiddlers in a list

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.listed = function(source,operator,options) {
	var results = [];
	// Function to check an individual title
	function checkTiddler(title) {
		$tw.utils.pushTop(results,options.wiki.findListingsOfTiddler(title));
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
