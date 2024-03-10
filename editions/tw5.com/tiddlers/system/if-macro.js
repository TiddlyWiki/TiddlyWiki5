/*\
title: $:/editions/tw5.com/if-macro.js
type: application/javascript
tags: $:/deprecated
module-type: macro

DEPRECATED -- Since TW v5.3.x this documentation macro is not needed anymore
Use: https://tiddlywiki.com/#Conditional%20Shortcut%20Syntax instead

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
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

})();
