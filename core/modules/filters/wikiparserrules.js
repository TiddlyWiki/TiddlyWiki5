/*\
title: $:/core/modules/filters/wikiparserrules.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the names of the wiki parser rules in this wiki

\*/

"use strict";

/*
Export our filter function
*/
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
