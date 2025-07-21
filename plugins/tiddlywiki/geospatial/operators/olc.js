/*\
title: $:/plugins/tiddlywiki/geospatial/operators/olc.js
type: application/javascript
module-type: filteroperator

Filter operators for open location code conversions

\*/

"use strict";

const openlocationcode = require("$:/plugins/tiddlywiki/geospatial/openlocationcode.js");
const turf = require("$:/plugins/tiddlywiki/geospatial/turf.js");
const geotools = require("$:/plugins/tiddlywiki/geospatial/geotools.js");

exports["olc-decode"] = function(source,operator,options) {
	let olc;
	try {
		olc = openlocationcode.decode(operator.operands[0] || "");
	} catch(e) {
		return [];
	}
	const suffixes = (operator.suffixes || [])[0] || [];
	let obj;
	if(suffixes.includes("bounds")) {
		obj = turf.polygon([[
			[olc.longitudeLo,olc.latitudeLo],
			[olc.longitudeLo,olc.latitudeHi],
			[olc.longitudeHi,olc.latitudeHi],
			[olc.longitudeHi,olc.latitudeLo],
			[olc.longitudeLo,olc.latitudeLo]
		]]);
	} else {
		obj = turf.point([olc.longitudeCenter,olc.latitudeCenter]);
	}
	return [JSON.stringify(obj)];
};

exports["olc-encode"] = function(source,operator,options) {
	const lat = $tw.utils.parseNumber(operator.operands[0] || "0");
	const long = $tw.utils.parseNumber(operator.operands[1] || "0");
	const codelength = $tw.utils.parseNumber(operator.operands[2] || "0") || openlocationcode.CODE_PRECISION_NORMAL;
	let olc;
	try {
		olc = openlocationcode.encode(lat,long,codelength);
	} catch(e) {
		return [];
	}
	return [olc];
};
