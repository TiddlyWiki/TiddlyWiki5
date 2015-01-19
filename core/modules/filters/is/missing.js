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
		missing = options.wiki.getMissingTitles();
	source(function(tiddler,title) {
		var i = missing.indexOf(title);
		if(
			"!" === prefix && i < 0 ||
			"!" !== prefix && i >= 0
		) {
			results.push(title);
		}
	});
	return results;
};

})();