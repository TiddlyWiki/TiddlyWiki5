/*\
title: $:/plugins/tiddlywiki/geospatial/operators/transformation.js
type: application/javascript
module-type: filteroperator

Filter operators for geospatial transformation

\*/

"use strict";

var turf = require("$:/plugins/tiddlywiki/geospatial/turf.js"),
	geotools = require("$:/plugins/tiddlywiki/geospatial/geotools.js");

exports.geounion = makeTransformation("union");

exports.geointersect = makeTransformation("intersect");

exports.geodifference = makeTransformation("difference");

function makeTransformation(methodName) {
	return function(source,operator,options) {
		// Collect the input
		var jsonObjects = [];
		source(function(tiddler,title) {
			var jsonObject = $tw.utils.parseJSONSafe(title,null);
			if(jsonObject) {
				jsonObjects.push(jsonObject)
			}
		});
		// Perform the transformation
		var result = geojsonOp(jsonObjects,methodName);
		return [JSON.stringify(result)];
	};
}

function geojsonOp(geojsonObjects, op) {
	var resultFeatures = [];
	$tw.utils.each(geojsonObjects,function (geojson1) {
		if(geojson1.type === "FeatureCollection") {
			resultFeatures = resultFeatures.length ? resultFeatures : geojson1.features;
		} else if(geojson1.type === "Feature") {
			resultFeatures = resultFeatures.length ? resultFeatures : [geojson1];
		}
		$tw.utils.each(geojsonObjects,function (geojson2) {
			if(geojson1 !== geojson2) {
				var newResultFeatures = [];
				$tw.utils.each(resultFeatures,function (feature1) {
					if(geojson2.type === "FeatureCollection") {
						$tw.utils.each(geojson2.features,function (feature2) {
							var result;
							if(op === "union") {
								result = turf.union(feature1, feature2);
							} else if(op === "intersect") {
								result = turf.intersect(feature1, feature2);
							} else if(op === "difference") {
								result = turf.difference(feature1, feature2);
							}
							if(result) {
								newResultFeatures.push(result);
							}
						});
					} else if(geojson2.type === "Feature") {
						var result;
						if(op === "union") {
							result = turf.union(feature1, geojson2);
						} else if(op === "intersect") {
							result = turf.intersect(feature1, geojson2);
						} else if(op === "difference") {
							result = turf.difference(feature1, geojson2);
						}
						if(result) {
							newResultFeatures.push(result);
						}
					}
				});
				resultFeatures = newResultFeatures;
			}
		});
	});
	return turf.featureCollection(resultFeatures);
}
