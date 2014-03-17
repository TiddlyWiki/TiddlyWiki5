/*\
title: $:/core/modules/filters/is/shadow.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[shadow]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.shadow = function(source,prefix,options) {
	var results = [];
	// Function to check a tiddler
	function checkTiddler(title) {
		var match = options.wiki.isShadowTiddler(title);
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
		if(prefix !== "!") {
			options.wiki.eachShadow(function(tiddler,title) {
				results.push(title);
			});
		} else {
			$tw.utils.each(source,function(element,title) {
				checkTiddler(title);
			});
		}
	}
	return results;
};

})();
