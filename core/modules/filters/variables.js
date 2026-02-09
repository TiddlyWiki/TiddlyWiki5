/*\
title: $:/core/modules/filters/variables.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the names of the active variables

\*/

"use strict";

/*
Export our filter function
*/
exports.variables = function(source, operator, options) {
	const widget = options.widget;
	if(!widget || typeof widget.enumerateVariables !== "function") {
		return [];
	}
	return widget.enumerateVariables();
};

