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
exports.after = ["rootwidget"];
exports.before = ["render"];
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
	// Install geolocation message handler
	$tw.rootWidget.addEventListener("tm-request-geolocation",function(event) {
		var widget = event.widget,
			wiki = widget.wiki || $tw.wiki,
			params = event.paramObject || {},
			actionsSuccess = params.actionsSuccess,
			actionsError = params.actionsError;
		// Assemble the options for getCurrentPosition()
		const opts = {
			enableHighAccuracy: params.accuracy !== "low",
			timeout: Infinity,
			maximumAge: 0
		};
		if(params.timeout !== undefined) {
			opts.timeout = $tw.utils.parseInt(params.timeout);
		}
		if(params.maximumAge !== undefined) {
			opts.maximumAge = $tw.utils.parseInt(params.maximumAge);
		}
		// Get the current position
		try {
			navigator.geolocation.getCurrentPosition(function successHandler(pos) {
				// Invoke the success actions
				wiki.invokeActionString(actionsSuccess,undefined,{
					timestamp: $tw.utils.stringifyDate(new Date(pos.timestamp)),
					latitude:  "" + pos.coords.latitude,
					longitude:  "" + pos.coords.longitude,
					altitude:  "" + pos.coords.altitude,
					accuracy:  "" + pos.coords.accuracy,
					altitudeAccuracy:  "" + pos.coords.altitudeAccuracy,
					heading:  "" + pos.coords.heading,
					speed:  "" + pos.coords.speed
				},{parentWidget: $tw.rootWidget});
			},function errorHandler(err) {
				// Invoke the error actions
				wiki.invokeActionString(actionsError,undefined,{
					"error": "" + err.message
				},{parentWidget: $tw.rootWidget});
			},opts);
		} catch(ex) {
			// Invoke the error actions
			wiki.invokeActionString(actionsError,undefined,{
				"error": "" + ex
			},{parentWidget: $tw.rootWidget});
		}
	});
};

})();
