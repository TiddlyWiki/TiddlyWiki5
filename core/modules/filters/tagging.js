/*\
title: $:/core/modules/filters/tagging.js
type: application/javascript
module-type: filteroperator

Filter operator returning all tiddlers that are tagged with the selected tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.tagging = function(source,operator,options) {
	var count = 0, result, index = [];
	source(function(tiddler,title) {
		index[count++] = options.wiki.getTiddlersWithTag(title);
	});
	result = index[0] || [];
	while(count-- > 1){
		if("all" === operator.suffix){
			result = $tw.utils.intersect(result,index[count]);
		} else {
			$tw.utils.pushTop(result,index[count]);
		}
	}
	return result;
};

})();