/*\
title: $:/core/modules/macros/charcode.js
type: application/javascript
module-type: macro

Macro to return a character using the character-code as input.
If the code isn't found the character is returned.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "charcode";

exports.params = [
	{name: "codes"},
];

exports.run = function(codes) {
	var lookup = $tw.config.lookup,
		tokens = codes.trim().split(/\s+/),
		results = [];
	tokens.map(function(name) {
		var code = lookup[name.toLowerCase()];
		if (code) {
			results.push(String.fromCharCode(code));
		} else {
			results.push(String.fromCharCode($tw.utils.parseInt(name)));
		}
	})
	return results.join("");
}

})();