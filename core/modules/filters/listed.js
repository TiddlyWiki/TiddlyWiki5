/*\
title: $:/core/modules/filters/listed.js
type: application/javascript
module-type: filteroperator

Filter operator returning all tiddlers that have the selected tiddlers in a list

\*/

"use strict";

/*
Export our filter function
*/
exports.listed = function(source,operator,options) {
	const field = operator.operand || "list";
	const results = [];
	source((tiddler,title) => {
		$tw.utils.pushTop(results,options.wiki.findListingsOfTiddler(title,field));
	});
	return results;
};
