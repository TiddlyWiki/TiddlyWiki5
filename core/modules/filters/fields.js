/*\
title: $:/core/modules/filters/fields.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the names of the fields on the selected tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.fields = function(source,operator,options) {
	var self = this,
		results = [];
	// Function to check an individual title
	function checkTiddler(title) {
		// Return the fields on the specified tiddler
		var tiddler = options.wiki.getTiddler(title);
		if(tiddler) {
			for(var fieldName in tiddler.fields) {
				$tw.utils.pushTop(results,fieldName);
			}
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
