/*\
title: $:/core/modules/macros/makedatauri.js
type: application/javascript
module-type: macro

Macro to convert a string of text to a data URI

<<makedatauri text:"Text to be converted" type:"text/vnd.tiddlywiki">>

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "makedatauri";

exports.params = [
	{name: "text"},
	{name: "type"}
];

/*
Run the macro
*/
exports.run = function(text,type) {
	return $tw.utils.makeDataUri(text,type);
};

})();
