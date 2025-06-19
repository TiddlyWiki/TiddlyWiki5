/*\
title: $:/core/modules/filters/previous.js
type: application/javascript
module-type: filteroperator

Filter operator returning the tiddler whose title occurs immediately prior in the list supplied in the operand tiddler

\*/

"use strict";

/*
Export our filter function
*/
exports.previous = function(source,operator,options) {
	var results = [],
		list = options.wiki.getTiddlerList(operator.operand);
	source(function(tiddler,title) {
		var match = list.indexOf(title);
		// increment match and then test if result is in range
		match--;
		if(match >= 0) {
			results.push(list[match]);
		}
	});
	return results;
};
