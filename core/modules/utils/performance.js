/*\
title: $:/core/modules/utils/performance.js
type: application/javascript
module-type: global

Performance measurement.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function Performance(enabled) {
	this.enabled = !!enabled;
	this.measures = {}; // Hashmap of current values of measurements
	this.logger = new $tw.utils.Logger("performance");
}

/*
Wrap performance reporting around a top level function
*/
Performance.prototype.report = function(name,fn) {
	var self = this;
	if(this.enabled) {
		return function() {
			self.measures = {};
			var startTime = $tw.utils.timer(),
				result = fn.apply(this,arguments);
			self.logger.log(name + ": " + $tw.utils.timer(startTime) + "ms");
			for(var m in self.measures) {
				self.logger.log("+" + m + ": " + self.measures[m] + "ms");
			}
			return result;
		};
	} else {
		return fn;
	}
};

/*
Wrap performance measurements around a subfunction
*/
Performance.prototype.measure = function(name,fn) {
	var self = this;
	if(this.enabled) {
		return function() {
			var startTime = $tw.utils.timer(),
				result = fn.apply(this,arguments),
				value = self.measures[name] || 0;
			self.measures[name] = value + $tw.utils.timer(startTime);
			return result;
		};
	} else {
		return fn;
	}
};

exports.Performance = Performance;

})();
