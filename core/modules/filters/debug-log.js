/*\
title: $:/core/modules/filters/debug-log.js
type: application/javascript
module-type: filteroperator
Filter operator for logging the current list and an optional variable value to the console
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports["debug-log"] = function(source,operator,options) {
	var results = [],
	    data = {},
	    logTitle = operator.suffix || "debug-log";
	
	if (operator.operand) {
		data[operator.operand] = (options.widget && options.widget.getVariable(operator.operand,{defaultValue:""}));
	}
	source(function(tiddler,title) {
		results.push(title);
	});
	console.group(logTitle);
	$tw.utils.logTable(results);
	if (operator.operand) {
		$tw.utils.logTable(data);
	}
	console.groupEnd();
	
	return results;
};

})();
