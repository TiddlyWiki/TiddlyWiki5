/*\
title: $:/core/modules/filters/changecount.js
type: application/javascript
module-type: filteroperator

Filter operator for retrieving the changecount for each title in the list.

\*/

"use strict";

/*
Export our filter function
*/
exports.changecount = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		results.push(options.wiki.getChangeCount(title) + "");
	});
	return results;
};
