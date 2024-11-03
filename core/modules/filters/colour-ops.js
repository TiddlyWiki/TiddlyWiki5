/*\
title: $:/core/modules/filters/colour-ops.js
type: application/javascript
module-type: filteroperator

Filter operators for colour operations

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Color = require("$:/core/modules/utils/dom/color.js").Color;

exports["colour-lighten"] = makeColourOperator(function (c, operator, options) {
	return c.lighten($tw.utils.parseNumber(operator.operand));
});

exports["colour-darken"] = makeColourOperator(function (c, operator, options) {
	return c.darken($tw.utils.parseNumber(operator.operand));
});

exports["colour-oklch"] = makeColourOperator(function (c, operator, options) {
	var prop = ((operator.suffixes || [])[0] || ["l"])[0];
console.log("Prop",prop,$tw.utils.parseNumber(operator.operand))
	if(["l","c","h"].indexOf(prop) !== -1) {
		c.oklch[prop] = $tw.utils.parseNumber(operator.operand);
	}
	return c;
});

function makeColourOperator(fn) {
	return function (source, operator, options) {
		var results = [];
		source(function (tiddler, title) {
			var c = $tw.utils.parseCSSColorObject(title);
			if (c) {
				c = fn(c, operator, options);
				results.push(c.display().toString());
			} else {
				results.push("");
			}
		});
		return results;
	};
}

})();
