/*\
title: $:/plugins/tiddlywiki/geospatial/operators/lookup.js
type: application/javascript
module-type: filteroperator

Filter operators for geospatial lookup

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var turf = require("$:/plugins/tiddlywiki/geospatial/turf.js"),
	geotools = require("$:/plugins/tiddlywiki/geospatial/geotools.js");

exports.geolookup = function(source,operator,options) {
	// Get the GeoJSON object
	var output = [],
		jsonObject = $tw.utils.parseJSONSafe(operator.operands[0],null);
	if(jsonObject) {
		// Process the input points
		source(function(tiddler,title) {
			var point = geotools.parsePoint(title),
				result = getPolygonsContainingPoint(jsonObject,point);
			output.push(JSON.stringify(result))
		});
	}
	// Perform the transformation
	return output;
};

function getPolygonsContainingPoint(featureCollection,point) {
	// Filter the GeoJSON feature collection to only include polygon features containing the point
	const properties = [];
	turf.featureEach(featureCollection,function(feature) {
		if(feature.geometry.type === "Polygon" && turf.booleanPointInPolygon(point,feature)) {
			properties.push(feature.properties);
		}
	});
	return properties;
}

})();
