/*\
title: $:/core/modules/filters/is/orphan.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[orphan]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.orphan = function(source,prefix,options) {
	var results = [],
		orphanTitles = options.wiki.getOrphanTitles();
	// Iterate through the source tiddlers
	if($tw.utils.isArray(source)) {
		$tw.utils.each(source,function(title) {
			var match = orphanTitles.indexOf(title) !== -1;
			if(prefix === "!") {
				match = !match;
			}
			if(match) {
				results.push(title);
			}
		});
	} else {
		$tw.utils.each(source,function(element,title) {
			var match = orphanTitles.indexOf(title) !== -1;
			if(prefix === "!") {
				match = !match;
			}
			if(match) {
				results.push(title);
			}
		});
	}
	return results;
};

})();
