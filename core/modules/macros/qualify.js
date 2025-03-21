/*\
title: $:/core/modules/macros/qualify.js
type: application/javascript
module-type: macro

Macro to qualify a state tiddler title according

\*/

"use strict";

/*
Information about this macro
*/

exports.name = "qualify";

exports.params = [
	{name: "title"}
];

/*
Run the macro
*/
exports.run = function(title) {
	return title + "-" + this.getStateQualifier();
};
