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
	var results = [],
		list = options.wiki.getTiddlerList(operator.operand);
	
	function checkTiddler(title) {
		var match = list.indexOf(title);
		// decrement match and then test if result is in range
		match--;
		if( match >= 0 ) {
			results.push(list[match]);
		}
	}
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
	return results;
};

})();
