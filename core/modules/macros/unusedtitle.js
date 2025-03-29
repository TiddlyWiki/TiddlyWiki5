/*\
title: $:/core/modules/macros/unusedtitle.js
type: application/javascript
module-type: macro

Macro to return a new title that is unused in the wiki. It can be given a name as a base.
\*/

"use strict";

exports.name = "unusedtitle";

exports.params = [
	{name: "baseName"},
	{name: "separator"},
	{name: "template"},
	{name: "startCount"}
];

/*
Run the macro
*/
exports.run = function(baseName,separator,template,startCount) {
	separator = separator || " ";
	startCount = startCount || 0;
	if(!baseName) {
		baseName = $tw.language.getString("DefaultNewTiddlerTitle");
	}
	// $tw.wiki.generateNewTitle = function(baseTitle,options)
	// options.prefix must be a string!
	return this.wiki.generateNewTitle(baseName, {"prefix": separator, "template": template, "startCount": startCount}).trim();
};
