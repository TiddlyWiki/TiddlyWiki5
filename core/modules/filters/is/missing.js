/*\
title: $:/core/modules/filters/is/missing.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[missing]]

\*/

"use strict";

/*
Export our filter function
*/
exports.missing = function(source,prefix,options) {
	const results = [];
	if(prefix === "!") {
		source((tiddler,title) => {
			if(options.wiki.tiddlerExists(title)) {
				results.push(title);
			}
		});
	} else {
		source((tiddler,title) => {
			if(!options.wiki.tiddlerExists(title)) {
				results.push(title);
			}
		});
	}
	return results;
};
