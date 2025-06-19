/*\
title: $:/plugins/tiddlywiki/confetti/startup.js
type: application/javascript
module-type: startup

Setup the root widget event handlers

\*/
"use strict";

// Export name and synchronous status
exports.name = "confetti";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// Install the root widget event handlers
exports.startup = function() {
	$tw.confettiManager = new $tw.ConfettiManager();
	$tw.rootWidget.addEventListener("tm-confetti-launch",function(event) {
		var paramObject = event.paramObject || {},
			options = {},
			extractNumericParameter = function(name) {
				if(paramObject[name]) {
					options[name] = $tw.utils.parseNumber(paramObject[name]);
				}
			},
			extractListParameter = function(name) {
				if(paramObject[name]) {
					options[name] = $tw.utils.parseStringArray(paramObject[name]);
				}
			},
			extractBooleanParameter = function(name) {
				if(paramObject[name]) {
					options[name] = paramObject[name] === "yes";
				}
			};
		$tw.utils.each("particleCount angle spread startVelocity decay gravity drift ticks scalar zIndex".split(" "),function(name) {
			extractNumericParameter(name);
		});
		$tw.utils.each("colors shapes".split(" "),function(name) {
			extractListParameter(name);
		});
		if(paramObject.originX && paramObject.originY) {
			options.origin = {
				x: paramObject.originX && $tw.utils.parseNumber(paramObject.originX),
				y: paramObject.originY && $tw.utils.parseNumber(paramObject.originY)
			};
		}
		extractBooleanParameter("disableForReducedMotion");
		var delay = paramObject.delay ? $tw.utils.parseNumber(paramObject.delay) : 0;
		$tw.confettiManager.launch(delay,options);
	});
	$tw.rootWidget.addEventListener("tm-confetti-reset",function(event) {
		$tw.confettiManager.reset();
	});
};
