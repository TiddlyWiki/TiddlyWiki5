/*\
title: $:/core/modules/macros/makedatauri.js
type: application/javascript
module-type: macro
\*/

"use strict";

exports.name = "makedatauri";

exports.params = [
	{name: "text"},
	{name: "type"},
	{name: "_canonical_uri"}
];

exports.run = function(text,type,_canonical_uri) {
	return $tw.utils.makeDataUri(text,type,_canonical_uri);
};
