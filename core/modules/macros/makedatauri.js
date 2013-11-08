/*\
title: $:/core/modules/macros/makedatauri.js
type: application/javascript
module-type: macro

Macro to convert the content of a tiddler to a data URI

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
	type = type || "text/vnd.tiddlywiki";
	var typeInfo = $tw.config.contentTypeInfo[type] || $tw.config.contentTypeInfo["text/plain"],
		isBase64 = typeInfo.encoding === "base64",
		parts = [];
	parts.push("data:");
	parts.push(type);
	parts.push(isBase64 ? ";base64" : "");
	parts.push(",");
	parts.push(isBase64 ? text : encodeURIComponent(text));
	return parts.join("");
};

})();
