/*\
title: $:/core/modules/filters/varlist.js
type: application/javascript
module-type: filteroperator

Retrieve the value of a variable as a list

[all[shadows+tiddlers]]

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.varlist = function(source,operator,options) {
	// Check for common optimisations
	var variableInfo = options.widget.getVariableInfo(operator.operand);
	if(variableInfo) {
		return options.wiki.makeTiddlerIterator(variableInfo.resultList);
	} else {
		return [];
	}
};

})();
