/*\
title: $:/core/modules/macros/unusedtitle.js
type: application/javascript
module-type: macro

Macro to return a new title that is unused in the wiki. It can be given a name as a base.
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "unusedtitle";

exports.params = [
	{name: "baseName"},
	{name: "prefix"}
];

/*
Run the macro
*/
exports.run = function(baseName, prefix) {
	prefix = prefix || " ";
	if(!baseName) {
		baseName = $tw.language.getString("DefaultNewTiddlerTitle");
	}
	return this.wiki.generateNewTitle(baseName, {"prefix":prefix});
};

})();
