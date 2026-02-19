/*\
title: $:/core/modules/filters/subfilter.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

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
