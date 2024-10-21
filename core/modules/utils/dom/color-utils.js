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

exports.parseCSSColor = function(colourString) {
	var Color = require("$:/core/modules/utils/dom/color.js").Color,
		c = null;
	try {
		c = new Color(colourString);
	} catch(e) {
		// Do nothing on an error
	}
	if(c) {
		var rgb = c.srgb;
		return [rgb[0],rgb[1],rgb[2],c.alpha];
	} else {
		return null;
	}
};

})();
