/*\
title: $:/plugins/tiddlywiki/geospatial/operators/helper.js
type: application/javascript
module-type: filteroperator

Filter operators for geospatial helpers

\*/

"use strict";

const turf = require("$:/plugins/tiddlywiki/geospatial/turf.js");

exports.geopoint = function(source,operator,options) {
	const lat = $tw.utils.parseNumber(operator.operands[0] || "0");
	const long = $tw.utils.parseNumber(operator.operands[1] || "0");
	const alt = $tw.utils.parseNumber(operator.operands[2] || "0");
	return [JSON.stringify(turf.point([long,lat,alt]))];
};
