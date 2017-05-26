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
		get = "!" !== prefix,
		missing = options.wiki.getMissingTitles();
	source(function(tiddler,title) {
		var i = missing.indexOf(title);
		if(get && i >= 0 || !get && i < 0) {
			results.push(title);
		}
	});
	return results;
};

})();