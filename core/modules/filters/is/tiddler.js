/*\
title: $:/core/modules/filters/is/tiddler.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[tiddler]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.tiddler = function(source,prefix,options) {
	var results = [];
	// Function to check a tiddler
	function checkTiddler(title) {
		var match = options.wiki.tiddlerExists(title);
		if(prefix === "!") {
			match = !match;
		}
		if(match) {
			results.push(title);
		}
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
