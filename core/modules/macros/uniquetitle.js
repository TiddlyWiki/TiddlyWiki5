/*\
title: $:/core/modules/macros/uniquetitle.js
type: application/javascript
module-type: macro
Macro to return a unique title given a base name
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "uniquetitle";

exports.params = [
	{name: "baseName"},
	{name: "options"}
];

/*
Run the macro
*/
exports.run = function(baseName, options) {
	if (!baseName) {
		baseName = $tw.language.getString("DefaultNewTiddlerTitle");
	}
	return this.wiki.generateNewTitle(baseName, options);
};

})();
