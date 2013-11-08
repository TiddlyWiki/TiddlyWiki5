/*\
title: $:/core/modules/macros/qualify.js
type: application/javascript
module-type: macro

Macro to qualify a state tiddler title according

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "qualify";

exports.params = [
	{name: "title"}
];

/*
Run the macro
*/
exports.run = function(title) {
	return title + "-" + this.getStateQualifier();
};

})();
