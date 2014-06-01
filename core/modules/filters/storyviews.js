/*\
title: $:/core/modules/filters/storyviews.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the names of the story views in this wiki

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.storyviews = function(source,operator,options) {
	var results = [],
		storyviews = {};
	$tw.modules.applyMethods("storyview",storyviews);
	$tw.utils.each(storyviews,function(info,name) {
		results.push(name);
	});
	results.sort();
	return results;
};

})();
