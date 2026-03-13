/*\
title: $:/core/modules/macros/parent-ancestorcount.js
type: application/javascript
module-type: macro

Macro to return the parent widget this.ancestors variable

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "parent-ancestorcount";

exports.params = [];

/*
Run the macro
*/
exports.run = function() {
	return (this.parentWidget) ? this.parentWidget.getAncestorCount() + "" : "";
};
