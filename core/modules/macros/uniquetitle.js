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

/*
Information about this macro
*/

exports.name = "unusedtitle";

exports.params = [
	{name: "baseTitle"},
	{name: "options"}
];

/*
Run the macro
*/
exports.run = function(baseTitle, options) {
	if(!baseTitle) {
		baseTitle = $tw.language.getString("DefaultNewTiddlerTitle");
	}
	return this.wiki.generateNewTitle(baseTitle, options);
};

})();
