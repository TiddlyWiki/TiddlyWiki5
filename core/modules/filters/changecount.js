/*\
title: $:/core/modules/filters/changecount.js
type: application/javascript
module-type: filteroperator

Filter operator to return the changecount for the current tiddler

\*/

"use strict";

exports.changecount = function(source,operator,options) {
	let results = [];
	source((tiddler,title) => {
		results.push(options.wiki.getChangeCount(title).toString());
	});
	return results;
};