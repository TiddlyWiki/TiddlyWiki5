/*\
title: $:/core/modules/filters/subfilter.js
type: application/javascript
module-type: filteroperator

Filter operator returning its operand evaluated as a filter

\*/

"use strict";

/*
Export our filter function
*/
exports.subfilter = function(source,operator,options) {
	const list = options.wiki.filterTiddlers(operator.operand,options.widget,source);
	if(operator.prefix === "!") {
		const results = [];
		source((tiddler,title) => {
			if(!list.includes(title)) {
				results.push(title);
			}
		});
		return results;
	} else {
		return list;
	}
};
