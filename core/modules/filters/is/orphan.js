/*\
title: $:/core/modules/filters/is/orphan.js
type: application/javascript
module-type: isfilteroperator

Filter function for [is[orphan]]

\*/

"use strict";

/*
Export our filter function
*/
exports.orphan = function(source,prefix,options) {
	const results = [];
	const orphanTitles = options.wiki.getOrphanTitles();
	if(prefix === "!") {
		source((tiddler,title) => {
			if(!orphanTitles.includes(title)) {
				results.push(title);
			}
		});
	} else {
		source((tiddler,title) => {
			if(orphanTitles.includes(title)) {
				results.push(title);
			}
		});
	}
	return results;
};
