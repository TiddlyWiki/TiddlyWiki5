/*\
title: $:/core/modules/filters/is/image.js
type: application/javascript
module-type: isfilteroperator
\*/

"use strict";

exports.image = function(source,prefix,options) {
	var results = [];
	if(prefix === "!") {
		source(function(tiddler,title) {
			if(!options.wiki.isImageTiddler(title)) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(options.wiki.isImageTiddler(title)) {
				results.push(title);
			}
		});
	}
	return results;
};
