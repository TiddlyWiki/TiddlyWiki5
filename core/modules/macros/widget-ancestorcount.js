/*\
title: $:/core/modules/macros/widget-ancestorcount.js
type: application/javascript
module-type: macro

Macro to return the widget this.ancestors variable

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "widget-ancestorcount";

exports.params = [];

/*
Run the macro
*/
exports.run = function() {
	return this.getAncestorCount() + "" || "";
};
