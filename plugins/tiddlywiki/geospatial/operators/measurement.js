/*\
title: $:/plugins/tiddlywiki/geospatial/operators/measurement.js
type: application/javascript
module-type: filteroperator

Filter operators for geospatial measurement

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var turf = require("$:/plugins/tiddlywiki/geospatial/turf.js"),
	geotools = require("$:/plugins/tiddlywiki/geospatial/geotools.js");

var VALID_UNITS = ["miles","kilometers","radians","degrees"],
	DEFAULT_UNITS = "miles";

exports.geodistance = function(source,operator,options) {
	var from = geotools.parsePoint(operator.operands[0]),
		to = geotools.parsePoint(operator.operands[1]),
		units = operator.operands[2] || DEFAULT_UNITS;
	if(VALID_UNITS.indexOf(units) === -1) {
		units = DEFAULT_UNITS;
	}
	return [JSON.stringify(turf.distance(from,to,{units: units}))];
};

})();
