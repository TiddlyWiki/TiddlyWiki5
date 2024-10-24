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

exports["colour-lighten"] = makeColourOperator(function (c, operator, operands) {
	return c.lighten($tw.utils.parseNumber(operator.operand));
});

exports["colour-darken"] = makeColourOperator(function (c, operator, operands) {
	return c.darken($tw.utils.parseNumber(operator.operand));
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
