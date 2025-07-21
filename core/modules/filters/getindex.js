/*\
title: $:/core/modules/filters/getindex.js
type: application/javascript
module-type: filteroperator

returns the value at a given index of datatiddlers

\*/

"use strict";

/*
Export our filter function
*/
exports.getindex = function(source,operator,options) {
	let data; let title; const results = [];
	if(operator.operand) {
		source((tiddler,title) => {
			title = tiddler ? tiddler.fields.title : title;
			data = options.wiki.extractTiddlerDataItem(tiddler,operator.operand);
			if(data) {
				results.push(data);
			}
		});
	}
	return results;
};
