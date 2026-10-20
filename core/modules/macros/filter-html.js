/*\
title: $:/core/modules/macros/filter-html.js
type: application/javascript
module-type: macro

Macro to return a syntax-highlighted HTML representation of a filter string.
\*/

"use strict";

exports.name = "filter-html";

exports.params = [
	{ name: "filter" }
];

/*
Run the macro
*/
exports.run = function(filter) {
	return this.wiki.parseFilterToHtml(filter || "");
};

