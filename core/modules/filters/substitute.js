/*\
title: $:/core/modules/filters/substitute.js
type: application/javascript
module-type: filteroperator

Filter operator for substituting variables and embedded filter expressions with their corresponding values

\*/

"use strict";

/*
Export our filter function
*/
exports.substitute = function(source,operator,options) {
	const results = [];
	const operands = [];
	$tw.utils.each(operator.operands,(operand,index) => {
		operands.push({
			name: (index + 1).toString(),
			value: operand
		});
	});
	source((tiddler,title) => {
		if(title) {
			results.push(options.wiki.getSubstitutedText(title,options.widget,{substitutions: operands}));
		}
	});
	return results;
};

