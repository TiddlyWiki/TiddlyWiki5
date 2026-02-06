/*\
title: $:/core/modules/filters/is/binary.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[binary]]

\*/

"use strict";

/*
Export our filter function
*/
exports.binary = function(source,prefix,options) {
	var results = [];
	if(prefix === "!") {
		source(function(tiddler,title) {
			if(!options.wiki.isBinaryTiddler(title)) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(options.wiki.isBinaryTiddler(title)) {
				results.push(title);
			}
		});
	}
	return results;
};
