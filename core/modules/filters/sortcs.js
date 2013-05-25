/*\
title: $:/core/modules/filters/sortcs.js
type: application/javascript
module-type: filteroperator

Filter operator for case-sensitive sorting

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.sortcs = function(source,operator,options) {
	var results;
	if($tw.utils.isArray(source)) {
		results = source;
	} else {
		results = [];
		$tw.utils.each(source,function(element,title) {
			results.push(title);
		});
	}
	options.wiki.sortTiddlers(results,operator.operand,operator.prefix === "!",true);
	return results;
};

})();
