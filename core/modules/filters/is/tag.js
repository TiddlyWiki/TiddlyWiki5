/*\
title: $:/core/modules/filters/is/tag.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[tag]]

\*/

"use strict";

/*
Export our filter function
*/
exports.tag = function(source,prefix,options) {
	const results = [];
	const tagMap = options.wiki.getTagMap();
	if(prefix === "!") {
		source((tiddler,title) => {
			if(!$tw.utils.hop(tagMap,title)) {
				results.push(title);
			}
		});
	} else {
		source((tiddler,title) => {
			if($tw.utils.hop(tagMap,title)) {
				results.push(title);
			}
		});
	}
	return results;
};
