/*\
title: $:/core/modules/filters/untagged.js
type: application/javascript
module-type: filteroperator

Filter operator returning all the selected tiddlers that are untagged

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.untagged = function(source,operator,options) {
	var results = [];
	// Function to check an individual title
	function checkTiddler(title) {
		var tiddler = options.wiki.getTiddler(title),
			match = tiddler && $tw.utils.isArray(tiddler.fields.tags) && tiddler.fields.tags.length > 0;
		if(operator.prefix !== "!") {
			match = !match;
		}
		if(match) {
			$tw.utils.pushTop(results,title);
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
