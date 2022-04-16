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
	{name: "title"},
	{name: "footprint"}
];

/*
Run the macro
*/
exports.run = function(title,footprint) {
	if(footprint === "yes") {
		return title + "-" + this.getStateQualifier() + "_" + this.generateRenderTreeFootprint();
	} else {
		return title + "-" + this.getStateQualifier();
	}
};

})();
