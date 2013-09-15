/*\
title: $:/core/modules/filters/sort.js
type: application/javascript
module-type: filteroperator

Filter operator for sorting

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.sort = function(source,operator,options) {
	var results;
	if($tw.utils.isArray(source)) {
		results = source.slice(0);
	} else {
		results = [];
		$tw.utils.each(source,function(element,title) {
			results.push(title);
		});
	}
	options.wiki.sortTiddlers(results,operator.operand,operator.prefix === "!");
	return results;
};

})();
