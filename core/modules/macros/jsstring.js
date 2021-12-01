/*\
title: $:/core/modules/macros/jsstring.js
type: application/javascript
module-type: macro

Macro to returns a string and replaces \r, \n, \t strings with their character codes.
All existing CRLF's are removed, which allows us to make the wikitext more readable.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "jsstring";

exports.params = [
	{name: "text"}//,
//	{name: "mode", default: "strict"}
];

/*
mode: relaxed .. Native \r\n are removed prior to activating the character codes. Better wikitext readability
      strict  .. (default) Behaves like a standard js-string
*/

exports.run = function(text, mode) {
//	if (mode === "relaxed") {
//		return text.replace(/\r?\n/g,"").replace(/\\n/g,"\n").replace(/\\r/g,"\r").replace(/\\t/g,"\t");
//	} else if (mode === "strict") {
		return text.replace(/\\n/g,"\n").replace(/\\r/g,"\r").replace(/\\t/g,"\t");
//	}
}

})();