/*\
title: $:/core/modules/macros/qualify.js
type: application/javascript
module-type: macro

Macro to qualify a state tiddler title according

\*/
(function(){

/*jslint node: true, browser: true */
/*global exports:false */
"use strict";

/*
Information about this macro
*/
exports.name = "qualify";
exports.params = [
	{name: "title"},
	{name: "isUnique"}
];
/*
Run the macro
*/
exports.run = function(title,isUnique) {
	if (isUnique === "yes") { return title }
	else { return title + "-" + this.getStateQualifier(/*name*/) }
};

})();
