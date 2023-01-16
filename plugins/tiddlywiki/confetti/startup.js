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
	var manager = new ConfettiManager();
	$tw.rootWidget.addEventListener("tm-confetti-launch",function(event) {
		var paramObject = event.paramObject || {},
			options = {},
			extractNumericParameter = function(name) {
				options[name] = paramObject[name] && $tw.utils.parseNumber(paramObject[name]);
			},
			extractListParameter = function(name) {
				options[name] = paramObject[name] && $tw.utils.parseStringArray(paramObject[name]);
			},
			extractBooleanParameter = function(name) {
				options[name] = paramObject[name] && paramObject[name] === "yes";
			};
		$tw.utils.each("particleCount angle spread startVelocity decay gravity drift ticks scalar zIndex".split(" "),function(name) {
			extractNumericParameter(name);
		});
		$tw.utils.each("colors shapes".split(" "),function(name) {
			extractListParameter(name);
		});
		options.origin = {
			x: paramObject.originX && $tw.utils.parseNumber(paramObject.originX),
			y: paramObject.originY && $tw.utils.parseNumber(paramObject.originY)
		};
		extractBooleanParameter("disableForReducedMotion");
		var delay = paramObject.delay ? $tw.utils.parseNumber(paramObject.delay) : 0;
		manager.launch(delay,options);
	});
	$tw.rootWidget.addEventListener("tm-confetti-reset",function(event) {
		manager.reset();
	});
};

function ConfettiManager() {
	this.outstandingTimers = [];
}

ConfettiManager.prototype.launch = function (delay,options) {
	var self = this;
	if(delay > 0) {
		var id = setTimeout(function() {
			var p = self.outstandingTimers.indexOf(id);
			if(p !== -1) {
				self.outstandingTimers.splice(p,1);
			} else {
				console.log("Confetti Manager Error: Cannot find previously stored timer ID");
				debugger;
			}
			confetti(options);
		},delay);
		this.outstandingTimers.push(id);
	} else {
		confetti(options);
	}
};

ConfettiManager.prototype.reset = function () {
	$tw.utils.each(this.outstandingTimers,function(id) {
		clearTimeout(id);
	});
	this.outstandingTimers = [];
	confetti.reset();
};

})();
