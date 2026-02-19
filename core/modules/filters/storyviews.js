/*\
title: $:/core/modules/filters/storyviews.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

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
