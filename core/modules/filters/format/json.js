/*\
title: $:/core/modules/filters/format/json.js
type: application/javascript
module-type: formatfilteroperator
\*/

"use strict";

/*
Export our filter function
*/
exports.json = function(source,operand,options) {
	const results = [];
	let spaces = null;
	if(operand) {
		spaces = /^\d+$/.test(operand) ? parseInt(operand,10) : operand;
	}
	source((tiddler,title) => {
		let data = $tw.utils.parseJSONSafe(title);
		try {
			data = JSON.parse(title);
		} catch(e) {
			data = undefined;
		}
		if(data !== undefined) {
			results.push(JSON.stringify(data,null,spaces));
		}
	});
	return results;
};
