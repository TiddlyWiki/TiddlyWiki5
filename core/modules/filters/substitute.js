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
	var results = [],
		operands = [];
	$tw.utils.each(operator.operands,function(operand,index){
		operands.push({
			name: (index + 1).toString(),
			value: operand
		});
	});
	source(function(tiddler,title) {
		if(title) {
			results.push(options.wiki.getSubstitutedText(title,options.widget,{substitutions:operands}));
		}
	});
	return results;
};

