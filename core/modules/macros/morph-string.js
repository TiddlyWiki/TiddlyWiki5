/*\
title: $:/core/modules/macros/morph.js
type: application/javascript
module-type: macro

Macro to return a string that is shifted in the unicode character space

\*/
(function(){

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";
	

exports.name = "morph";

exports.params = [
	{name: "text"},
	{name: "from"},
	{name: "to"},
	{name: "prefix"}
];

function fromCharacter(character) {
	return character.codePointAt(undefined);
}

/*
* toUnicodeFromString('🐘 🐨');
* //> 0x1f418; 0x20; 0x1f428;
*/

function toUnicodeFromString(text, from, to, prefix) {
	prefix = prefix || "";
	from = fromCharacter(from) || 0;
	to = fromCharacter(to) || 0;
	var results = [];

	// if (from === 0 || to === 0) {
	// 	return "from / to parameter missing";
	// }

	for (var codePoint of text) {
		if (prefix.trim() === "0x") {
			if (codePoint === " ") {
				results.push(prefix + (fromCharacter(codePoint)).toString(16))
			} else {
				results.push(prefix + (fromCharacter(codePoint) - from + to).toString(16));
			}
		} else {
			if (codePoint === " ") {
				results.push(prefix + fromCharacter(codePoint));
			} else {
				results.push(prefix + (fromCharacter(codePoint) - from + to));
			}
		}
	}
	return results.join(";") + ";";
}

exports.run = function(text, from, to, prefix) {
	prefix = prefix || "&#";
	return toUnicodeFromString(text, from, to, prefix);
};

})();