/*\
title: $:/core/modules/filters/each.js
type: application/javascript
module-type: filteroperator

Filter operator that selects one tiddler for each unique value of the specified field

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.each = function(source,operator,options) {
	var results = [],
		values = {};
	source(function(tiddler,title) {
		if(tiddler) {
			var value = tiddler.getFieldString(operator.operand);
			if(!$tw.utils.hop(values,value)) {
				values[value] = true;
				results.push(title);
			}
		}
	});
	return results;
};

})();
