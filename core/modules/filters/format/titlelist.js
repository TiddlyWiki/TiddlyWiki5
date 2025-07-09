/*\
title: $:/core/modules/filters/format/titlelist.js
type: application/javascript
module-type: formatfilteroperator
\*/

"use strict";

/*
Export our filter function
*/
exports.titlelist = function(source,operand,options) {
	const results = [];
	source((tiddler,title) => {
		if(title && title.length) {
			results.push($tw.utils.stringifyList([title]));
		}
	});
	return results;
};
