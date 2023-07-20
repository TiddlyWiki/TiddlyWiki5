/*\
title: $:/plugins/tiddlywiki/confetti/confetti-manager.js
type: application/javascript
module-type: global

Confetti manager

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var confetti = require("$:/plugins/tiddlywiki/confetti/confetti.js");

function ConfettiManager() {
	this.outstandingTimers = [];
}

ConfettiManager.prototype.launch = function (delay,options) {
	var self = this,
		defaultOptions = {
			scalar: 1.2,
			particleCount: 400,
			zIndex: 2000
		};
	options = $tw.utils.extend(defaultOptions,options);
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

exports.ConfettiManager = ConfettiManager;

})();
