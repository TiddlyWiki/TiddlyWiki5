/*\
title: $:/core/modules/macros/contrastcolour.js
type: application/javascript
module-type: macro

Macro to choose which of two colours has the highest contrast with a base colour

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "contrastcolour";

exports.params = [
	{name: "target"},
	{name: "fallbackTarget"},
	{name: "colourA"},
	{name: "colourB"}
];

/*
Run the macro
*/
exports.run = function(target,fallbackTarget,colourA,colourB) {
	var rgbTarget = $tw.utils.parseCSSColorObject(target) || $tw.utils.parseCSSColorObject(fallbackTarget);
	if(!rgbTarget) {
		return colourA;
	}
	var rgbColourA = $tw.utils.parseCSSColorObject(colourA),
		rgbColourB = $tw.utils.parseCSSColorObject(colourB);
	if(rgbColourA && !rgbColourB) {
		return colourA;
	}
	if(rgbColourB && !rgbColourA) {
		return colourB;
	}
	if(!rgbColourA && !rgbColourB) {
		// If neither colour is readable, return a crude inverse of the target
		rgbTarget.srgb.r = 1 - rgbTarget.srgb.r;
		rgbTarget.srgb.g = 1 - rgbTarget.srgb.g;
		rgbTarget.srgb.b = 1 - rgbTarget.srgb.b;
		return rgbTarget.display();
	}
	var aContrast = rgbColourA.contrast(rgbTarget,"DeltaPhi"),
		bContrast = rgbColourB.contrast(rgbTarget,"DeltaPhi");
	return aContrast > bContrast ? colourA : colourB;
};

})();
