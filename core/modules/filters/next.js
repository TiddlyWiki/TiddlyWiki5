/*\
title: $:/core/modules/filters/next.js
type: application/javascript
module-type: filteroperator

Filter operator returning the tiddler whose title occurs next in the list supplied in the operand tiddler

\*/

"use strict";

/*
Export our filter function
*/
exports.next = function(source,operator,options) {
	const results = [];
	const list = options.wiki.getTiddlerList(operator.operand);
	source((tiddler,title) => {
		let match = list.indexOf(title);
		// increment match and then test if result is in range
		match++;
		if(match > 0 && match < list.length) {
			results.push(list[match]);
		}
	});
	return results;
};
