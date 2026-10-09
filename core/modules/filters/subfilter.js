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
	var suffixes = operator.suffixes || [],
		defaultFilterRunPrefix = (suffixes[0] && suffixes[0][0]) || options.defaultFilterRunPrefix || "or";
	var list = options.wiki.filterTiddlers(operator.operand,options.widget,source,{defaultFilterRunPrefix});
	if(operator.prefix === "!") {
		const results = [],
			listSet = new Set(list);
		source((tiddler,title) => {
			if(!listSet.has(title)) {
				results.push(title);
			}
		});
		return results;
	} else {
		return list;
	}
};
