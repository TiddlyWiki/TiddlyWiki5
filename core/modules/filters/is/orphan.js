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
	var results = [],
		orphanTitles = options.wiki.getOrphanTitles();
	if(prefix === "!") {
		source(function(tiddler,title) {
			if(orphanTitles.indexOf(title) === -1) {
				results.push(title);
			}
		});
	} else {
		source(function(tiddler,title) {
			if(orphanTitles.indexOf(title) !== -1) {
				results.push(title);
			}
		});
	}
	return results;
};
