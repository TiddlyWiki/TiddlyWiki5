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

var Color = require("$:/core/modules/utils/dom/color.js").Color,
	colourSpacesList = Object.keys(Color.spaces),
	hueAdjustersList = ["raw","increasing","decreasing","longer","shorter"];

exports["colour-lighten"] = makeSerialColourOperator(function (colour, operator, options) {
	return colour.lighten($tw.utils.parseNumber(operator.operand)).display().toString();
});

exports["colour-darken"] = makeSerialColourOperator(function (colour, operator, options) {
	return colour.darken($tw.utils.parseNumber(operator.operand)).display().toString();
});

exports["colour-get-oklch"] = makeSerialColourOperator(function (colour, operator, options) {
	var prop = ((operator.suffixes || [])[0] || ["l"])[0];
	if(["l","c","h"].indexOf(prop) !== -1) {
		colour = colour.oklch[prop];
	}
	return colour.toString();
});

exports["colour-set-oklch"] = makeSerialColourOperator(function (colour, operator, options) {
	var prop = ((operator.suffixes || [])[0] || ["l"])[0];
	if(["l","c","h"].indexOf(prop) !== -1) {
		colour.oklch[prop] = $tw.utils.parseNumber(operator.operand);
	}
	return colour.display().toString();
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

exports["colour-best-contrast"] = makeParallelColourOperator(function (colours, operator, options, originalColours) {
	var bestContrast = 0,
		bestColour = null;
	if(colours.length < 2) {
		return [];
	}
	var targetColour = colours[colours.length - 1];
	for(var t=0; t<colours.length; t++) {
		var colour = colours[t];
		if(colour) {
			var contrast = colour.contrast(targetColour,"DeltaPhi");
			if(contrast > bestContrast) {
				bestContrast = contrast;
				bestColour = originalColours[t];
			}
		}
	}
	if(bestColour) {
		return [bestColour];
	} else {
		return [];
	}
});

exports["colour-interpolate"] = makeParallelColourOperator(function (colours, operator, options) {
	// Get the colour space suffix
	var space = (((operator.suffixes || [])[0] || ["srgb"])[0]).toLowerCase();
	if(colourSpacesList.indexOf(space) === -1) {
		space = "srgb";
	}
	// Special case for less than two colours
	if(colours.length < 2) {
		return [];
	}
	// Get the hue adjuster suffix
	var hueAdjuster = (((operator.suffixes || [])[1] || ["shorter"])[0]).toLowerCase();
	if(hueAdjustersList.indexOf(hueAdjuster) === -1) {
		hueAdjuster = "shorter";
	}
	// Compute the range function
	var rangefn = colours[0].range(colours[1],{space: space, hue: hueAdjuster}),
		outputColours = [];
	$tw.utils.each(operator.operands,function(operand) {
		// Get the index
		var index = $tw.utils.parseNumber(operand);
		// Calculate the interpolated colour
		var colour = rangefn(index);
		outputColours.push(colour.display().toString());
	});
	return outputColours;
});

function makeSerialColourOperator(fn) {
	return function (source, operator, options) {
		var results = [];
		source(function (tiddler, title) {
			var c = $tw.utils.parseCSSColorObject(title);
			if (c) {
				c = fn(c, operator, options);
				results.push(c);
			} else {
				results.push("");
			}
		});
		return results;
	};
}

function makeParallelColourOperator(fn) {
	return function (source, operator, options) {
		var originalColours = [],
			colours = [];
		source(function (tiddler, title) {
			originalColours.push(title);
			colours.push($tw.utils.parseCSSColorObject(title));
		});
		return fn(colours, operator, options, originalColours);
	};
}

})();
