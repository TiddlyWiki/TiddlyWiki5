/*\
title: $:/core/modules/macros/dumpvariables.js
type: application/javascript
module-type: macro

Macro to dump all active variable values

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "dumpvariables";

exports.params = [
];

/*
Run the macro
*/
exports.run = function() {
	var output = ["|!Variable |!Value |"],
		variables = [], variable;
	for(variable in this.variables) {
		variables.push(variable);
	}
	variables.sort();
	for(var index=0; index<variables.length; index++) {
		var variable = variables[index];
		output.push("|" + variable + " |<input size=50 value=<<" + variable + ">>/> |")
	}
	return output.join("\n");
};

})();
