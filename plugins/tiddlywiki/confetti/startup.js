/*\
title: $:/plugins/tiddlywiki/confetti/startup.js
type: application/javascript
module-type: startup

Setup the root widget event handlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var confetti = require("$:/plugins/tiddlywiki/confetti/confetti.js");

// Export name and synchronous status
exports.name = "confetti";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// Install the root widget event handlers
exports.startup = function() {
	$tw.rootWidget.addEventListener("tm-confetti-launch",function(event) {
		var paramObject = event.paramObject || {},
			options = {};
		options.particleCount = paramObject.particleCount && $tw.utils.parseNumber(paramObject.particleCount);
		options.angle = paramObject.angle && $tw.utils.parseNumber(paramObject.angle);
		options.spread = paramObject.spread && $tw.utils.parseNumber(paramObject.spread);
		options.startVelocity = paramObject.startVelocity && $tw.utils.parseNumber(paramObject.startVelocity);
		options.decay = paramObject.decay && $tw.utils.parseNumber(paramObject.decay);
		options.gravity = paramObject.gravity && $tw.utils.parseNumber(paramObject.gravity);
		options.drift = paramObject.drift && $tw.utils.parseNumber(paramObject.drift);
		options.ticks = paramObject.ticks && $tw.utils.parseNumber(paramObject.ticks);
		options.origin = {
			x: paramObject.originX && $tw.utils.parseNumber(paramObject.originX),
			y: paramObject.originY && $tw.utils.parseNumber(paramObject.originY)
		};
		options.colors = paramObject.colors && $tw.utils.parseStringArray(paramObject.colors);
		options.shapes = paramObject.shapes && $tw.utils.parseStringArray(paramObject.shapes);
		options.scalar = paramObject.scalar && $tw.utils.parseNumber(paramObject.scalar);
		options.zIndex = paramObject.zIndex && $tw.utils.parseNumber(paramObject.zIndex);
		options.disableForReducedMotion = paramObject.disableForReducedMotion && paramObject.disableForReducedMotion === "yes";
		confetti(options);
	});
	$tw.rootWidget.addEventListener("tm-confetti-reset",function(event) {
		confetti.reset();
	});
};

})();
