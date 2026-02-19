/*\
title: $:/core/modules/macros/now.js
type: application/javascript
module-type: macro
\*/

"use strict";

exports.name = "now";

exports.params = [
	{name: "format"}
];

exports.run = function(format) {
	return $tw.utils.formatDateString(new Date(),format || "0hh:0mm, DDth MMM YYYY");
};
