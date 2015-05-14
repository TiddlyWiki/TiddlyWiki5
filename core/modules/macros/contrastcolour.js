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
	var rgbTarget = $tw.utils.parseCSSColor(target) || $tw.utils.parseCSSColor(fallbackTarget);
	if(!rgbTarget) {
		return colourA;
	}
	var rgbColourA = $tw.utils.parseCSSColor(colourA),
		rgbColourB = $tw.utils.parseCSSColor(colourB);
	if(rgbColourA && !rgbColourB) {
		return rgbColourA;
	}
	if(rgbColourB && !rgbColourA) {
		return rgbColourB;
	}
	if(!rgbColourA && !rgbColourB) {
		// If neither colour is readable, return a crude inverse of the target
		return [255 - rgbTarget[0],255 - rgbTarget[1],255 - rgbTarget[2],rgbTarget[3]];
	}
	// Colour brightness formula derived from http://www.w3.org/WAI/ER/WD-AERT/#color-contrast
	var brightnessTarget = rgbTarget[0] * 0.299 + rgbTarget[1] * 0.587 + rgbTarget[2] * 0.114,
		brightnessA = rgbColourA[0] * 0.299 + rgbColourA[1] * 0.587 + rgbColourA[2] * 0.114,
		brightnessB = rgbColourB[0] * 0.299 + rgbColourB[1] * 0.587 + rgbColourB[2] * 0.114;
	return Math.abs(brightnessTarget - brightnessA) > Math.abs(brightnessTarget - brightnessB) ? colourA : colourB;
};

})();
