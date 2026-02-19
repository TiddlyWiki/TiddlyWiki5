/*\
title: $:/core/modules/filters/variables.js
type: application/javascript
module-type: filteroperator
\*/

"use strict";

exports.variables = function(source,operator,options) {
	var names = [],
		widget = options.widget;
	while(widget && !widget.hasOwnProperty("variables")) {
		widget = widget.parentWidget;
	}
	if(widget && widget.variables) {
		for(var variable in widget.variables) {
			names.push(variable);
		}
	}
	return names.sort();
};
