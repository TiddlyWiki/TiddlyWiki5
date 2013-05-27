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
	// Convert the source to an array if necessary
	if(!$tw.utils.isArray(source)) {
		var copy = [];
		$tw.utils.each(source,function(element,title) {
			copy.push(title);
		});
		source = copy;
	}
	// Collect up the first tiddler with each unique value of the specified field
	var results = [],values = {};
	$tw.utils.each(source,function(title) {
		var tiddler = options.wiki.getTiddler(title);
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
