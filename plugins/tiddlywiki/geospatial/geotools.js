/*\
title: $:/plugins/tiddlywiki/geospatial/geotools.js
type: application/javascript
module-type: library

Geospatial utilities

\*/

"use strict";

const turf = require("$:/plugins/tiddlywiki/geospatial/turf.js");

/*
Parse a string as a GeoJSON Point
*/
exports.parsePoint = function(str) {
	const defaultResult = function() {
		return turf.point([0,0,0]);
	};
	// If the string is missing then return 0,0,0
	if(!str) {
		return defaultResult();
	}
	// Convert to an object
	const json = $tw.utils.parseJSONSafe(str,null);
	if(json === null) {
		return defaultResult();
	}
	// Check it is a valid point
	if(turf.getType(json) !== "Point") {
		return defaultResult();
	}
	// Return the string now we know it is a valid GeoJSON Point
	return json;
};
