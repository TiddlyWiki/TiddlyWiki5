/*\
title: $:/core/modules/macros/morph-string.js
type: application/javascript
module-type: macro

Macro to return a string that is shifted in the unicode character space

\*/
(function(){

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";
	

exports.name = "morph-string";

exports.params = [
	{name: "text"},
	{name: "by"}
];

exports.run = function(text, by) {
	// var result = text.fromCharCode($tw.utils.parseInt(operand)));

	// String.prototype.toUnicode = function () {
	// 	return this.replace(/./g, function (char) {
	// 		return "&#" + String.charCodeAt(char) + ";";
	// 	});
	// };

    // function fromCharacter(character) {
    //     return character.codePointAt(undefined).toString(16);
    // }
	// /*
    //  * toUnicode.fromString('🎉 👋');
    //  * //> [ '1f389', '20', '1f44b' ]
    //  */
    // function fromString(characters, prefix = '') {
    //     return [...characters].reduce((accumulator, character) => {
    //         const unicode = toUnicode.fromCharacter(character);
    //         accumulator.push(`${prefix}${unicode}`);
    //         return accumulator;
    //     }, []);
    // }





	return result;
};

})();