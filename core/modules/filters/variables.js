/*\
title: $:/core/modules/filters/variables.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the names of the active variables

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.variables = function(source,operator,options) {
	var names = [];
	for(var variable in options.widget.variables) {
		names.push(variable);
	}
	return names.sort();
};

})();
