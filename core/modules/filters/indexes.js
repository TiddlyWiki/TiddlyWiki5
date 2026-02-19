/*\
title: $:/core/modules/filters/indexes.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.indexes = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		var data = options.wiki.getTiddlerDataCached(title);
		if(data) {
			$tw.utils.pushTop(results,Object.keys(data));
		}
	});
	results.sort();
	return results;
};
