/*\
title: $:/core/modules/macros/qualify.js
type: application/javascript
module-type: macro
\*/

"use strict";

exports.name = "qualify";

exports.params = [
	{name: "title"}
];

exports.run = function(title) {
	return title + "-" + this.getStateQualifier();
};
