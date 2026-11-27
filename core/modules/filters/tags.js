/*\
title: $:/core/modules/filters/tags.js
type: application/javascript
module-type: filteroperator

Filter operator returning all the tags of the selected tiddlers

\*/

"use strict";

/*
Export our filter function
*/
exports.tags = function(source,operator,options) {
	// A Set, because object keys that look like an integer are returned first in
	// numeric order, so a tag such as 2026 jumped ahead of the author's order
	var tags = new Set();
	source(function(tiddler,title) {
		if(tiddler && tiddler.fields.tags) {
			tiddler.fields.tags.forEach(function(tag) {
				tags.add(tag);
			});
		}
	});
	return Array.from(tags);
};
