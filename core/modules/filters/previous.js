/*\
title: $:/core/modules/filters/previous.js
type: application/javascript
module-type: filteroperator

Filter operator returning the tiddler whose title occurs immediately prior in the list supplied in the operand tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.previous = function(source,operator,options) {
	var results = [];
	function checkTiddler(title) {
		var match = list.indexOf(title);
		// decrement match and then test if result is in range
		match--;
		if( match >= 0 ) {
			results.push(list[match]);
		}
	}
	if(operator.operand) {
		var list = options.wiki.getTiddlerList(operator.operand);
	
		// Iterate through the source tiddlers
		if($tw.utils.isArray(source)) {
			$tw.utils.each(source,function(title) {
				checkTiddler(title);
			});
		} else {
			$tw.utils.each(source,function(element,title) {
				checkTiddler(title);
			});
		}
	} else {
		if($tw.utils.isArray(source)) {
			var match = source.indexOf(options.currTiddlerTitle) - 1;
			if(match >= 0) {
				results.push(source[match]);
			}
		} else {
			var last_title;
			for(var title in source) {
				if(title === options.currTiddlerTitle) {
					results.push(last_title);
					break;
				}
				last_title = title;
			};
		}
	}
	return results;
};

})();
