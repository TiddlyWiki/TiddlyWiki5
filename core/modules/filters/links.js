/*\
title: $:/core/modules/filters/links.js
type: application/javascript
module-type: filteroperator

Filter operator for returning all the links from a tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.links = function(source,operator,options) {
	var results = [];
	// Function to check an individual title
	function checkTiddler(title) {
		$tw.utils.pushTop(results,options.wiki.getTiddlerLinks(title));
	};
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
