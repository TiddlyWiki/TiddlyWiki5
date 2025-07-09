/*\
title: $:/core/modules/filters/field.js
type: application/javascript
module-type: filteroperator

Filter operator for comparing fields for equality

\*/

"use strict";

/*
Export our filter function
*/
exports.field = function(source,operator,options) {
	const results = []; let indexedResults;
	const fieldname = operator.suffix || operator.operator || "title";
	if(operator.prefix === "!") {
		if(operator.regexp) {
			source((tiddler,title) => {
				if(tiddler) {
					const text = tiddler.getFieldString(fieldname);
					if(text !== null && !operator.regexp.exec(text)) {
						results.push(title);
					}
				} else {
					results.push(title);
				}
			});
		} else {
			source((tiddler,title) => {
				if(tiddler) {
					const text = tiddler.getFieldString(fieldname);
					if(text !== null && text !== operator.operand) {
						results.push(title);
					}
				} else {
					results.push(title);
				}
			});
		}
	} else {
		if(operator.regexp) {
			source((tiddler,title) => {
				if(tiddler) {
					const text = tiddler.getFieldString(fieldname);
					if(text !== null && !!operator.regexp.exec(text)) {
						results.push(title);
					}
				}
			});
		} else {
			if(source.byField && operator.operand) {
				indexedResults = source.byField(fieldname,operator.operand);
				if(indexedResults) {
					return indexedResults;
				}
			}
			source((tiddler,title) => {
				if(tiddler) {
					const text = tiddler.getFieldString(fieldname);
					if(text !== null && text === operator.operand) {
						results.push(title);
					}
				}
			});
		}
	}
	return results;
};
