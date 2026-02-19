/*\
title: $:/core/modules/filters/fields.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.fields = function(source,operator,options) {
	var results = [],
		fieldName,
		suffixes = (operator.suffixes || [])[0] || [],
		operand = $tw.utils.parseStringArray(operator.operand);

	source(function(tiddler,title) {
		if(tiddler) {
			if(suffixes.indexOf("include") !== -1) {
				for(fieldName in tiddler.fields) {
					(operand.indexOf(fieldName) !== -1) ? $tw.utils.pushTop(results,fieldName) : "";
				}
			} else if (suffixes.indexOf("exclude") !== -1) {
				for(fieldName in tiddler.fields) {
					(operand.indexOf(fieldName) !== -1) ? "" : $tw.utils.pushTop(results,fieldName);
				}
			}
			else {
				for(fieldName in tiddler.fields) {
					$tw.utils.pushTop(results,fieldName);
				}
			}
		}
	});
	return results;
};
