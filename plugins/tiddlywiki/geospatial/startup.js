/*\
title: $:/plugins/tiddlywiki/geospatial/startup.js
type: application/javascript
module-type: startup

Geospatial initialisation

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "geospatial";
exports.after = ["load-modules"];
exports.synchronous = true;

exports.startup = function() {
	// var openlocationcode = require("$:/plugins/tiddlywiki/geospatial/openlocationcode.js");
	// var turf = require("$:/plugins/tiddlywiki/geospatial/turf.js");
	// Load Leaflet
	if($tw.browser) {
		$tw.Leaflet = require("$:/plugins/tiddlywiki/geospatial/leaflet.js");
		// Add Leaflet Marker Cluster Plugin
		require("$:/plugins/tiddlywiki/geospatial/leaflet.markercluster.js");	
	}
};

})();
