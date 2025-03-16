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
	var list = options.wiki.filterTiddlers(operator.operand,options.widget,source);
	if(operator.prefix === "!") {
		var results = [];
		source(function(tiddler,title) {
			if(list.indexOf(title) === -1) {
				results.push(title);
			}
		});
		return results;
	} else {
		return list;
	}
};
