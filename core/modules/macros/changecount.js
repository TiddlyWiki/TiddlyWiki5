/*\
title: $:/core/modules/macros/changecount.js
type: application/javascript
module-type: macro

Macro to return the changecount for the current tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "changecount";

exports.params = [];

/*
Run the macro
*/
exports.run = function() {
	return this.wiki.getChangeCount(this.getVariable("currentTiddler")) + "";
};

})();
