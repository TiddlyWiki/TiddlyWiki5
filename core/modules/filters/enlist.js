/*\
title: $:/core/modules/filters/enlist.js
type: application/javascript
module-type: filteroperator

Filter operator returning its operand parsed as a list

\*/

"use strict";

/*
Export our filter function
*/
exports.enlist = function(source,operator,options) {
	let allowDuplicates = false;
	switch(operator.suffix) {
		case "raw": {
			allowDuplicates = true;
			break;
		}
		case "dedupe": {
			allowDuplicates = false;
			break;
		}
	}
	const list = $tw.utils.parseStringArray(operator.operand,allowDuplicates);
	if(operator.prefix === "!") {
		const results = [];
		source((tiddler,title) => {
			if(!list.includes(title)) {
				results.push(title);
			}
		});
		return results;
	} else {
		return list;
	}
};
