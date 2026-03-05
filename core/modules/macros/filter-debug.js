/*\
title: $:/core/modules/macros/filter-debug.js
type: application/javascript
module-type: macro

Macro to return a wikitext debug table for a filter string.
\*/

"use strict";

exports.name = "filter-debug";

exports.params = [
	{ name: "filter" }
];

/*
Run the macro
*/
exports.run = function(filter) {
	return this.wiki.parseFilterToDebugTable(filter || "");
};
