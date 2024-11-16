/*\
title: $:/core/modules/utils/color-utils.js
type: application/javascript
module-type: utils

Color.js related utilities

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Color = require("$:/core/modules/utils/dom/color.js").Color;

/*
For backwards compatibility
*/
exports.parseCSSColor = function(colourString) {
	var c = exports.parseCSSColorObject(colourString);
	if(c) {
		var rgb = c.srgb;
		return [rgb[0],rgb[1],rgb[2],c.alpha];
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

})();
