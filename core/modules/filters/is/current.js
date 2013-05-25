/*\
title: $:/core/modules/filters/is/current.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[current]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.current = function(source,prefix,options) {
	var results = [];
	// Function to check a tiddler
	function checkTiddler(title) {
		if(title !== options.currTiddlerTitle) {
			results.push(title);
		}
	};
	// Iterate through the source tiddlers
	if($tw.utils.isArray(source)) {
		if(prefix === "!") {
			$tw.utils.each(source,function(title) {
				checkTiddler(title);
			});
		} else {
			if(source.indexOf(options.currTiddlerTitle) !== -1) {
				results.push(options.currTiddlerTitle);
			}
		}
	} else {
		if(prefix === "!") {
			$tw.utils.each(source,function(element,title) {
				checkTiddler(title);
			});
		} else {
			results.push(options.currTiddlerTitle);
		}
	}
	return results;
};

})();
