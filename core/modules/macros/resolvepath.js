/*\
title: $:/core/modules/macros/resolvepath.js
type: application/javascript
module-type: macro
\*/

"use strict";

exports.name = "resolvepath";

exports.params = [
	{name: "source"},
	{name: "root"}
];

exports.run = function(source, root) {
	return $tw.utils.resolvePath(source, root);
};
