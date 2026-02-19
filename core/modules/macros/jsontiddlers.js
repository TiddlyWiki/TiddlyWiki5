/*\
title: $:/core/modules/macros/jsontiddlers.js
type: application/javascript
module-type: macro
\*/

"use strict";

exports.name = "jsontiddlers";

exports.params = [
	{name: "filter"},
	{name: "spaces"}
];

exports.run = function(filter,spaces) {
	return this.wiki.getTiddlersAsJson(filter,$tw.utils.parseInt(spaces));
};
