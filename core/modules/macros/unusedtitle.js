/*\
title: $:/core/modules/macros/unusedtitle.js
type: application/javascript
module-type: macro
\*/

"use strict";

exports.name = "unusedtitle";

exports.params = [
	{name: "baseName"},
	{name: "separator"},
	{name: "template"},
	{name: "startCount"}
];

exports.run = function(baseName,separator,template,startCount) {
	separator = separator || " ";
	startCount = startCount || 0;
	if(!baseName) {
		baseName = $tw.language.getString("DefaultNewTiddlerTitle");
	}

	// options.prefix must be a string!
	return this.wiki.generateNewTitle(baseName, {"prefix": separator, "template": template, "startCount": startCount}).trim();
};
