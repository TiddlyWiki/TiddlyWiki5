/*\
title: $:/core/modules/filters/wikiparserrules.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.wikiparserrules = function(source,operator,options) {
	var results = [],
		operand = operator.operand;
	$tw.utils.each($tw.modules.types.wikirule,function(mod) {
		var exp = mod.exports;
		if(!operand || exp.types[operand]) {
			results.push(exp.name);
		}
	});
	results.sort();
	return results;
};
