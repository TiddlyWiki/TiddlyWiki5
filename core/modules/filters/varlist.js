/*\
title: $:/core/modules/filters/varlist.js
type: application/javascript
module-type: filteroperator

Retrieve the value of a variable as a list

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.varlist = function(source,operator,options) {
	var variableInfo = operator.operand && options.widget.getVariableInfo(operator.operand);
	if(variableInfo && variableInfo.text !== undefined) {
		return options.wiki.makeTiddlerIterator(variableInfo.resultList);
	} else {
		return [];
	}
};

})();
