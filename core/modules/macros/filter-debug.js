/*\
title: $:/core/modules/macros/filter-debug.js
type: application/javascript
module-type: macro

Macro to return a wikitext debug table for a filter string.
\*/

"use strict";

exports.name = "filter-debug";

exports.params = [
	{ name: "filter" },
	{ name: "narrowTable" }
];

/*
Run the macro
*/
exports.run = function(filter,narrowTable) {
	return this.wiki.parseFilterToDebugTable(filter || "",{narrowTable: narrowTable === "yes"});
};
