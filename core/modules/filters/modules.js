/*\
title: $:/core/modules/filters/modules.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the titles of the modules of a given type in this wiki

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.modules = function(source,operator,options) {
	var results = [];
	if(operator.operands.length >= 2) {
		// Return the modules that have the module property specified in the first operand with the value in the second operand
		source(function(tiddler,title) {
			$tw.utils.each($tw.modules.types[title],function(moduleInfo,moduleName) {
				if(require(moduleName)[operator.operands[0]] === operator.operands[1]) {
					results.push(moduleName);					
				}
			});
		});
	} else {
		// Return all the module names without filtering
		source(function(tiddler,title) {
			$tw.utils.each($tw.modules.types[title],function(moduleInfo,moduleName) {
				results.push(moduleName);
			});
		});
	}
	results.sort();
	return results;
};

})();
