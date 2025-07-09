/*\
title: $:/core/modules/filters/fields.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the names of the fields on the selected tiddlers

\*/

"use strict";

/*
Export our filter function
*/
exports.fields = function(source,operator,options) {
	const results = [];
	let fieldName;
	const suffixes = (operator.suffixes || [])[0] || [];
	const operand = $tw.utils.parseStringArray(operator.operand);

	source((tiddler,title) => {
		if(tiddler) {
			if(suffixes.includes("include")) {
				for(fieldName in tiddler.fields) {
					(operand.includes(fieldName)) ? $tw.utils.pushTop(results,fieldName) : "";
				}
			} else if(suffixes.includes("exclude")) {
				for(fieldName in tiddler.fields) {
					(operand.includes(fieldName)) ? "" : $tw.utils.pushTop(results,fieldName);
				}
			} // else if
			else {
				for(fieldName in tiddler.fields) {
					$tw.utils.pushTop(results,fieldName);
				}
			} // else
		} // if (tiddler)
	});
	return results;
};
