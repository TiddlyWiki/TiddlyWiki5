/*\
title: $:/core/modules/filters/is/image.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[image]]

\*/

"use strict";

/*
Export our filter function
*/
exports.image = function(source,prefix,options) {
	const results = [];
	if(prefix === "!") {
		source((tiddler,title) => {
			if(!options.wiki.isImageTiddler(title)) {
				results.push(title);
			}
		});
	} else {
		source((tiddler,title) => {
			if(options.wiki.isImageTiddler(title)) {
				results.push(title);
			}
		});
	}
	return results;
};
