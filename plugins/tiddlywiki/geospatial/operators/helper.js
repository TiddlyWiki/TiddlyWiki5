/*\
title: $:/plugins/tiddlywiki/geospatial/operators/helper.js
type: application/javascript
module-type: filteroperator

Filter operators for geospatial helpers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var turf = require("$:/plugins/tiddlywiki/geospatial/turf.js");

exports.geopoint = function(source,operator,options) {
	var lat = $tw.utils.parseNumber(operator.operands[0] || "0"),
		long = $tw.utils.parseNumber(operator.operands[1] || "0"),
		alt =  $tw.utils.parseNumber(operator.operands[2] || "0");
	return [JSON.stringify(turf.point([long,lat,alt]))];
};

})();
