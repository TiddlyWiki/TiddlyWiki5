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

exports.run = function(text) {
	$tw.utils.each($tw.config.escapeStringLookup,function(code, key) {
		var str = String.fromCharCode($tw.utils.parseInt(code));
		var s = $tw.utils.escapeRegExp(key);
		var x = new RegExp(s,"g");
		text = text.replace(x,str);
	});
	return text;
}

})();