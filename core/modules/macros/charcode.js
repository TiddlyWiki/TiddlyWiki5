/*\
title: $:/core/modules/macros/charcode.js
type: application/javascript
module-type: macro

Macro to return characters using the character-names as input.
If the name isn't found the character-code is used to return a character.
Only integer based codes are allowed

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
	var tokens = codes.trim().split(/\s+/), // Character tokens are a whitespace separated list
		results = [];
	$tw.utils.each(tokens,function(name) {
		var code = $tw.config.charNameLookup[name.toLowerCase()] || $tw.config.escapeStringLookup[name.toLowerCase()] || name;
		if (code !== "") {
			results.push(String.fromCharCode($tw.utils.parseInt(code)));
		}
	})
	return results.join("");
}

})();