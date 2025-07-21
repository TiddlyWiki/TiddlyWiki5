/*\
title: $:/core/modules/filters/title.js
type: application/javascript
module-type: filteroperator

Filter operator for comparing title fields for equality

\*/

"use strict";

/*
Export our filter function
*/
exports.title = function(source,operator,options) {
	const results = [];
	if(operator.prefix === "!") {
		source((tiddler,title) => {
			if(tiddler && tiddler.fields.title !== operator.operand) {
				results.push(title);
			}
		});
	} else {
		results.push(operator.operand);
	}
	return results;
};
