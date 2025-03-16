/*\
title: $:/editions/tw5.com/if-macro.js
type: application/javascript
module-type: macro
\*/

"use strict";

exports.name = ".if";

exports.params = [
	{ name: "cond" },
	{ name: "then" },
	{ name: "else" }
];

exports.run = function(cond, then, elze) {
	then = then || "";
	elze = elze || "";
	return cond ? then : elze;
};

