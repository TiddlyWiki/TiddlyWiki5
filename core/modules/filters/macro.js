/*\
title: $:/core/modules/filters/macro.js
type: application/javascript
module-type: filteroperator

Filter operator returning those input titles that are returned from a javascript macro

\*/

"use strict";

/*
Export our filter function
*/
exports.macro = function(source,operator,options) {
	const macroName = operator.operands[0],
		results = [];
	if($tw.macros[macroName] !== undefined) {
		results.push($tw.macros[macroName].run(...operator.operands.slice(1)));
	} else {
		// Return the input list if the macro wasn't found
		source((tiddler,title) => {
			results.push(title);
		});	
	}
	return results;
};
