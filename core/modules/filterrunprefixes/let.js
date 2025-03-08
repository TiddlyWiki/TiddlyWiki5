/*\
title: $:/core/modules/filterrunprefixes/let.js
type: application/javascript
module-type: filterrunprefix

Assign a value to a variable

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter prefix function
*/
exports.let = function(operationSubFunction,options) {
	// Save the variable name
	var name = options.suffixes[0][0];
	// Return the filter run prefix function
	return function(results,source,widget) {
		// Set the input source to the incoming results
		var inputSource = widget.wiki.makeTiddlerIterator(results.toArray());
		// Assign the result of the subfunction to the variable
		var variables = {};
		variables[name] = operationSubFunction(inputSource,widget)[0] || "";
		// Clear the results
		results.clear();
		// Return the variables
		return {
			variables: variables
		};
	};
};

})();
