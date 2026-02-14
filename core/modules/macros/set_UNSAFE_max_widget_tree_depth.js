/*\
title: $:/core/modules/macros/set_UNSAFE_max_widget_tree_depth.js
type: application/javascript
module-type: macro

Macro to set the parents widget UNSAFE_max_widget_tree_depth variable

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "set_UNSAFE_max_widget_tree_depth";

exports.params = [
	{name: "number"}
];

/*
Run the macro
*/
exports.run = function(number) {
	var iNumber = parseInt(number,10);
	if(!isNaN(iNumber) && iNumber >= 100) {
		if(this.parentWidget) {
			this.parentWidget.UNSAFE_max_widget_tree_depth = iNumber;
		}
	}
	return "";
};
