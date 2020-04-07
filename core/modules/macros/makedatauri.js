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
	{name: "type"},
	{name: "_canonical_uri"}
];

/*
Run the macro
*/
exports.run = function(text,type,_canonical_uri) {
	return $tw.utils.makeDataUri(text,type,_canonical_uri);
};

})();
