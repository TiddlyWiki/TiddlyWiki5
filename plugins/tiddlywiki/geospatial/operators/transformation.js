/*\
title: $:/plugins/tiddlywiki/geospatial/operators/transformation.js
type: application/javascript
module-type: filteroperator

Filter operators for geospatial transformation

\*/

"use strict";

const turf = require("$:/plugins/tiddlywiki/geospatial/turf.js");
const geotools = require("$:/plugins/tiddlywiki/geospatial/geotools.js");

exports.geounion = makeTransformation("union");

exports.geointersect = makeTransformation("intersect");

exports.geodifference = makeTransformation("difference");

function makeTransformation(methodName) {
	return function(source,operator,options) {
		// Collect the input
		const jsonObjects = [];
		source((tiddler,title) => {
			const jsonObject = $tw.utils.parseJSONSafe(title,null);
			if(jsonObject) {
				jsonObjects.push(jsonObject);
			}
		});
		// Perform the transformation
		const result = geojsonOp(jsonObjects,methodName);
		return [JSON.stringify(result)];
	};
}

function geojsonOp(geojsonObjects,op) {
	let resultFeatures = [];
	$tw.utils.each(geojsonObjects,(geojson1) => {
		if(geojson1.type === "FeatureCollection") {
			resultFeatures = resultFeatures.length ? resultFeatures : geojson1.features;
		} else if(geojson1.type === "Feature") {
			resultFeatures = resultFeatures.length ? resultFeatures : [geojson1];
		}
		$tw.utils.each(geojsonObjects,(geojson2) => {
			if(geojson1 !== geojson2) {
				const newResultFeatures = [];
				$tw.utils.each(resultFeatures,(feature1) => {
					if(geojson2.type === "FeatureCollection") {
						$tw.utils.each(geojson2.features,(feature2) => {
							let result;
							if(op === "union") {
								result = turf.union(feature1,feature2);
							} else if(op === "intersect") {
								result = turf.intersect(feature1,feature2);
							} else if(op === "difference") {
								result = turf.difference(feature1,feature2);
							}
							if(result) {
								newResultFeatures.push(result);
							}
						});
					} else if(geojson2.type === "Feature") {
						let result;
						if(op === "union") {
							result = turf.union(feature1,geojson2);
						} else if(op === "intersect") {
							result = turf.intersect(feature1,geojson2);
						} else if(op === "difference") {
							result = turf.difference(feature1,geojson2);
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
