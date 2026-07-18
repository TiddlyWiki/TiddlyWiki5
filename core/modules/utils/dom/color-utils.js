/*\
title: $:/core/modules/utils/color-utils.js
type: application/javascript
module-type: utils

Color.js related utilities

\*/

"use strict";

var Color = require("$:/core/modules/utils/dom/color.js").Color;

/*
For backwards compatibility
*/
exports.parseCSSColor = function(colourString) {
	var c = exports.parseCSSColorObject(colourString);
	if(c) {
		var rgb = c.srgb;
		// Return components in the 0-255 range, matching the legacy csscolorparser.
		// Clamp because Color.js can emit out-of-gamut sRGB components (e.g. from P3 inputs).
		return [
			Math.round(Math.max(0,Math.min(255,rgb[0] * 255))),
			Math.round(Math.max(0,Math.min(255,rgb[1] * 255))),
			Math.round(Math.max(0,Math.min(255,rgb[2] * 255))),
			c.alpha
		];
	} else {
		return null;
	}
};


/*
Preferred way to parse a Color.js colour
*/
exports.parseCSSColorObject = function(colourString) {
	var c = null;
	try {
		c = new Color(colourString);
	} catch(e) {
		// Return null if there is an error
	}
	return c;
};

/*
Convert a CSS colour to an RGB string suitable for use with the <input type="color"> element
*/
exports.convertCSSColorToRGBString = function(colourString) {
	var c = exports.parseCSSColorObject(colourString);
	if(c) {
		var hex = c.toString({format: "hex"});
		if(hex.length === 4) {
			hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
		}
		return hex;
	} else {
		return null;
	}
};
