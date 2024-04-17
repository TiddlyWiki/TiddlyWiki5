/*\
title: $:/core/modules/macros/get_UNSAFE_max_widget_tree_depth.js
type: application/javascript
module-type: macro

Macro to return the parents widget parentWidget.UNSAFE_max_widget_tree_depth variable

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "get_UNSAFE_max_widget_tree_depth";

exports.params = [];

/*
Run the macro
*/
exports.run = function() {
	return (this.parentWidget) ? this.parentWidget.UNSAFE_max_widget_tree_depth + "" : "";
};
