/*\
title: $:/core/modules/filters/moduleproperty.js
type: application/javascript
module-type: filteroperator

Filter [[module-name]moduleproperty[name]] retrieve a module property

\*/

"use strict";

/*
Export our filter function
*/
exports.moduleproperty = function(source,operator,options) {
	const results = [];
	source((tiddler,title) => {
		try {
			let value = require(title)[operator.operand || ""];
			if(value !== undefined) {
				if(typeof value !== "string") {
					value = JSON.stringify(value);
				}
				results.push(value);
			}
		} catch(e) {
			// Do nothing. It probably wasn't a module.
		}
	});
	results.sort();
	return results;
};
