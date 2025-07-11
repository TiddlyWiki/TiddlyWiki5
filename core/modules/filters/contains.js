/*\
title: $:/core/modules/filters/contains.js
type: application/javascript
module-type: filteroperator

Filter operator for finding values in array fields

\*/

"use strict";

/*
Export our filter function
*/
exports.contains = function(source,operator,options) {
	const results = [];
	const fieldname = operator.suffix || "list";
	if(operator.prefix === "!") {
		source((tiddler,title) => {
			if(tiddler) {
				const list = tiddler.getFieldList(fieldname);
				if(!list.includes(operator.operand)) {
					results.push(title);
				}
			} else {
				results.push(title);
			}
		});
	} else {
		source((tiddler,title) => {
			if(tiddler) {
				const list = tiddler.getFieldList(fieldname);
				if(list.includes(operator.operand)) {
					results.push(title);
				}
			}
		});
	}
	return results;
};
