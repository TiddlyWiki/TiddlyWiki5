/*\
title: $:/core/modules/macros/resolvepath.js
type: application/javascript
module-type: macro

Resolves a relative path for an absolute rootpath.

\*/

"use strict";

exports.name = "resolvepath";

exports.params = [
	{name: "source"},
	{name: "root"}
];

/*
Run the macro
*/
exports.run = function(source, root) {
	return $tw.utils.resolvePath(source, root);
};
