/*\
title: $:/core/modules/filters/untagged.js
type: application/javascript
module-type: filteroperator

Filter operator returning all the selected tiddlers that are untagged

\*/

"use strict";

/*
Export our filter function
*/
exports.untagged = function(source,operator,options) {
	var results = [],
		expected = (operator.prefix === "!");
	source(function(tiddler,title) {
		if(((tiddler && $tw.utils.isArray(tiddler.fields.tags) && tiddler.fields.tags.length > 0) === expected) || (!tiddler && !expected)) {
			results.push(title);
		}
	});
	return results;
};
