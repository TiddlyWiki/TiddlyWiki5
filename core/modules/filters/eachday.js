/*\
title: $:/core/modules/filters/eachday.js
type: application/javascript
module-type: filteroperator

Filter operator that selects one tiddler for each unique day covered by the specified date field

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.eachday = function(source,operator,options) {
	// Convert the source to an array if necessary
	if(!$tw.utils.isArray(source)) {
		var copy = [];
		$tw.utils.each(source,function(element,title) {
			copy.push(title);
		});
		source = copy;
	}
	// Collect up the first tiddler with each unique day value of the specified field
	var results = [],values = {};
	$tw.utils.each(source,function(title) {
		var tiddler = options.wiki.getTiddler(title);
		if(tiddler) {
			var value = tiddler.getFieldString(operator.operand).substr(0,8);
			if(!$tw.utils.hop(values,value)) {
				values[value] = true;
				results.push(title);
			}
		}
	});
	return results;
};

})();
