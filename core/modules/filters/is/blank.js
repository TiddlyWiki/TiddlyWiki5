/*\
title: $:/core/modules/filters/is/blank.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[blank]]

\*/

"use strict";

/*
Export our filter function
*/
exports.blank = function(source,prefix,options) {
	const results = [];
	if(prefix === "!") {
		source((tiddler,title) => {
			if(title) {
				results.push(title);
			}
		});
	} else {
		source((tiddler,title) => {
			if(!title) {
				results.push(title);
			}
		});
	}
	return results;
};
