/*\
title: $:/core/modules/macros/jsstring.js
type: application/javascript
module-type: macro

Macro to return a string. Replaces \r, \n, \t strings with their character codes.
All existing CRLF's are removed, which allows us to make the wikitext more readable.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "jsstring";

exports.params = [
	{name: "text"}
];

// TODO .. may be it should also use the config.js lookup table

exports.run = function(text, mode) {
		return text.replace(/\\n/g,"\n").replace(/\\r/g,"\r").replace(/\\t/g,"\t");
}

})();