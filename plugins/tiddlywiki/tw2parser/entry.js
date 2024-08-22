/*\
title: $:/macros/tiddlywiki/entry.js
type: application/javascript
module-type: macro
\*/
(function(){
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
/*
Information about this macro
returns value of key in a data json tiddler
note that macros are not connected with the refresh mechanism -use with caution.
*/
exports.name = "entryof";

exports.params = [
	{ name: "key" }, { name: "map" }
];
/*
Run the macro
*/
exports.run = function(key,map) {
	try {
		return  JSON.parse(map)[key];
	} catch(e) {
		return "";
	}
}
})();
