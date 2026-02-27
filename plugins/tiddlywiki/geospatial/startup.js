/*\
title: $:/plugins/tiddlywiki/geospatial/startup.js
type: application/javascript
module-type: startup

Geospatial initialisation

\*/

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
	$tw.rootWidget.addEventListener("tm-save-dom-to-image",function(event) {
		var params = event.paramObject || {},
			domToImage = require("$:/plugins/tiddlywiki/geospatial/dom-to-image-more.js"),
			domNode = document.querySelector(params.selector || "body.tc-body");
		if(domNode) {
			var method = "toPng";
			switch(params.format) {
				case "jpeg":
					// Intentional fallthrough
				case "jpg":
					method = "toJpeg";
					break;
				case "svg":
					method = "toSvg";
					break;
			}
			domToImage[method](domNode,{
				height: $tw.utils.parseInt(params.height) || domNode.offsetHeight,
				width: $tw.utils.parseInt(params.width) || domNode.offsetWidth,
				quality: $tw.utils.parseNumber(params.quality),
				scale: $tw.utils.parseNumber(params.scale) || 1
			})
				.then(function(dataUrl) {
				// Save the image
					if(params["save-file"]) {
						var link = document.createElement("a");
						link.download = params["save-file"];
						link.href = dataUrl;
						link.click();
					}
					// Save the tiddler
					if(params["save-title"]) {
						if(dataUrl.indexOf("data:image/svg+xml;") === 0) {
							var commaIndex = dataUrl.indexOf(",");
							$tw.wiki.addTiddler(new $tw.Tiddler({
								title: params["save-title"],
								type: "image/svg+xml",
								"text": decodeURIComponent(dataUrl.substring(commaIndex + 1))
							}));	
						} else {
							var parts = dataUrl.split(";base64,");
							$tw.wiki.addTiddler(new $tw.Tiddler({
								title: params["save-title"],
								type: parts[0].split(":")[1],
								"text": parts[1]
							}));	
						}
					}
				})
				.catch(function(error) {
					console.error("oops, something went wrong!", error);
				});
		}
	});
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
