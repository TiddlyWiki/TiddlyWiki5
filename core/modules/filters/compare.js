/*\
title: $:/core/modules/filters/compare.js
type: application/javascript
module-type: filteroperator

General purpose comparison operator

\*/

"use strict";

exports.compare = function(source,operator,options) {
	const suffixes = operator.suffixes || [];
	const type = (suffixes[0] || [])[0];
	const mode = (suffixes[1] || [])[0];
	const typeFn = $tw.utils.makeCompareFunction(type,{defaultType: "number"});
	const modeFn = modes[mode] || modes.eq;
	const invert = operator.prefix === "!";
	const results = [];
	source((tiddler,title) => {
		if(modeFn(typeFn(title,operator.operand)) !== invert) {
			results.push(title);
		}
	});
	return results;
};

var modes = {
	"eq"(value) {return value === 0;},
	"ne"(value) {return value !== 0;},
	"gteq"(value) {return value >= 0;},
	"gt"(value) {return value > 0;},
	"lteq"(value) {return value <= 0;},
	"lt"(value) {return value < 0;}
};
