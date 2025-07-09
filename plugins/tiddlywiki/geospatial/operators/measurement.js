/*\
title: $:/plugins/tiddlywiki/geospatial/operators/measurement.js
type: application/javascript
module-type: filteroperator

Filter operators for geospatial measurement

\*/

"use strict";

const turf = require("$:/plugins/tiddlywiki/geospatial/turf.js");
const geotools = require("$:/plugins/tiddlywiki/geospatial/geotools.js");

const VALID_UNITS = new Set(["miles","kilometers","radians","degrees"]);
const DEFAULT_UNITS = "miles";

exports.geodistance = function(source,operator,options) {
	const from = geotools.parsePoint(operator.operands[0]);
	const to = geotools.parsePoint(operator.operands[1]);
	let units = operator.operands[2] || DEFAULT_UNITS;
	if(!VALID_UNITS.has(units)) {
		units = DEFAULT_UNITS;
	}
	return [JSON.stringify(turf.distance(from,to,{units}))];
};

exports.geonearestpoint = function(source,operator,options) {
	const target = geotools.parsePoint(operator.operands[0]);
	const featureCollection = {
		"type": "FeatureCollection",
		"features": []
	};
	source((tiddler,title) => {
		const fc = $tw.utils.parseJSONSafe(title);
		if(fc) {
			if(fc.type === "FeatureCollection" && $tw.utils.isArray(fc.features)) {
				Array.prototype.push.apply(featureCollection.features,fc.features);
			} else if(fc.type === "Feature") {
				featureCollection.features.push(fc);
			}
		}
	});
	if(featureCollection.features.length > 0) {
		return [JSON.stringify(turf.nearestPoint(target,featureCollection))];
	} else {
		return [];
	}
};
