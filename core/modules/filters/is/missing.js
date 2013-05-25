/*\
title: $:/core/modules/filters/is/missing.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[missing]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.missing = function(source,prefix,options) {
	var results = [],
		missingTitles;
	// Iterate through the source tiddlers
	if($tw.utils.isArray(source)) {
		missingTitles = options.wiki.getMissingTitles();
		$tw.utils.each(source,function(title) {
			var match = missingTitles.indexOf(title) !== -1;
			if(prefix === "!") {
				match = !match;
			}
			if(match) {
				results.push(title);
			}
		});
	} else {
		if(prefix !== "!") {
			missingTitles = options.wiki.getMissingTitles();
			$tw.utils.each(missingTitles,function(title) {
				results.push(title);
			});
		} else {
			$tw.utils.each(source,function(element,title) {
				results.push(title);
			});
		}
	}
	return results;
};

})();
