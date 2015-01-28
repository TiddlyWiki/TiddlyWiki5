/*\
title: $:/core/modules/macros/resolvePath.js
type: application/javascript
module-type: macro

Resolves a relative path for an absolute rootpath.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "resolvePath";

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

})();
