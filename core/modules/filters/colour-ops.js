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

exports["colour-lighten"] = makeSerialColourOperator(function (c, operator, options) {
	return c.lighten($tw.utils.parseNumber(operator.operand));
});

exports["colour-darken"] = makeSerialColourOperator(function (c, operator, options) {
	return c.darken($tw.utils.parseNumber(operator.operand));
});

exports["colour-oklch"] = makeSerialColourOperator(function (c, operator, options) {
	var prop = ((operator.suffixes || [])[0] || ["l"])[0];
	if(["l","c","h"].indexOf(prop) !== -1) {
		c.oklch[prop] = $tw.utils.parseNumber(operator.operand);
	}
	return c;
});

exports["colour-contrast"] = makeParallelColourOperator(function (colours, operator, options) {
	var colourContrasts = [];
	$tw.utils.each(colours,function(colour,index) {
		if(!colour) {
			colour = $tw.utils.parseCSSColorObject("white");
			colours[index] = colour;
		}
		if(index > 0) {
			colourContrasts.push(colour.contrast(colours[index - 1],"DeltaPhi").toString());
		}
	});
	return colourContrasts;
});

function makeSerialColourOperator(fn) {
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

function makeParallelColourOperator(fn) {
	return function (source, operator, options) {
		var colours = [];
		source(function (tiddler, title) {
			colours.push($tw.utils.parseCSSColorObject(title));
		});
		return fn(colours, operator, options);
	};
}

})();
