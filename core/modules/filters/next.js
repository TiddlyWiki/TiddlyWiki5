/*\
title: $:/core/modules/filters/next.js
type: application/javascript
module-type: filteroperator

Filter operator returning the tiddler whose title occurs next in the list supplied in the operand tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.next = function(source,operator,options) {
	var results = [];
	function checkTiddler(title) {
		var match = list.indexOf(title);
		// increment match and then test if result is in range
		match++;
		if(match > 0 && match < list.length) {
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
			var match = source.indexOf(options.currTiddlerTitle) + 1;
			if(match > 0 && match < source.length) {
				results.push(source[match]);
			}
		} else {
			var matched = false;
			for(var title in source) {
				if(matched) {
					results.push(title);
					break;
				}
				matched = title === options.currTiddlerTitle;
			};
		}
	}
	return results;
};

})();
