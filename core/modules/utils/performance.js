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
	/**
	 * Hashmap by measurement name of {time:, invocations:}
	 * with optional "lastStart" for the last time calling "measureStart"
	 */
	this.reset();
	this.logger = new $tw.utils.Logger("performance");
	this.showGreeting();
}

Performance.prototype.reset = function() {
	this.measures = {};
};

Performance.prototype.showGreeting = function() {
	if($tw.browser) {
		this.logger.log("Execute $tw.perf.log(); to see filter execution timings");
	}
};

/*
Wrap performance reporting around a top level function
*/
Performance.prototype.report = function(name,fn) {
	var self = this;
	if(this.enabled) {
		return function() {
			var startTime = $tw.utils.timer(),
				result = fn.apply(this,arguments);
			self.logger.log(name + ": " + $tw.utils.timer(startTime).toFixed(2) + "ms");
			return result;
		};
	} else {
		return fn;
	}
};

Performance.prototype.log = function() {
	var self = this,
		totalTime = 0,
		orderedMeasures = Object.keys(this.measures).sort(function(a,b) {
			if(self.measures[a].time > self.measures[b].time) {
				return -1;
			} else if (self.measures[a].time < self.measures[b].time) {
				return + 1;
			} else {
				return 0;
			}
		});
	$tw.utils.each(orderedMeasures,function(name) {
		totalTime += self.measures[name].time;
	});
	var results = []
	$tw.utils.each(orderedMeasures,function(name) {
		var measure = self.measures[name];
		results.push({name: name,invocations: measure.invocations, avgTime: measure.time / measure.invocations, totalTime: measure.time, percentTime: (measure.time / totalTime) * 100})
	});
	self.logger.table(results);
};

/*
Wrap performance measurements around a subfunction
*/
Performance.prototype.measureFn = function(name, description,fn) {
	var self = this;
	if(this.enabled) {
		return function measureCallback() {
			var startTime = $tw.utils.timer(),
				result = fn.apply(this,arguments);
			if(!(name in self.measures)) {
				self.measures[name] = {time: 0, invocations: 0, desc: description || ""};
			}
			self.measures[name].time += $tw.utils.timer(startTime);
			self.measures[name].invocations++;
			return result;
		};
	} else {
		return fn;
	}
};

/**
 * Start a timer, add a record to `this.measures`.
 * Name has to be slag-separated, like "image-processing"; description is optional.
 */
Performance.prototype.timerStart = function(name, description) {
	if(this.enabled) {
			var measureStart = $tw.utils.timer();
			if(!(name in this.measures)) {
				this.measures[name] = {time: 0, invocations: 0, desc: description || ""};
			}
			this.measures[name].measureStart = measureStart;
	}
};

/**
 * If an operation you are timing fails before the timer can be stopped, you can clear that timer.
 */
Performance.prototype.clearTimer = function(name) {
	if (this.measures[name]) this.measures[name].measureStart = undefined;
};

Performance.prototype.timerEnd = function(name) {
	if(this.enabled) {
		if (!this.measures[name]) return;
		var measureStart = this.measures[name].measureStart;
		if (!measureStart) return;
		this.measures[name].time += $tw.utils.timer(measureStart);
		this.measures[name].invocations++;
		this.clearTimer(name);
	}
};

Performance.prototype.timer = function(name, description) {
	if(this.enabled) {
		if (!this.measures[name]) return this.timerStart(name, description);
		var measureStart = this.measures[name].measureStart;
		if (measureStart) return this.timerEnd(name);
		return this.timerStart(name, description);
	}
};

/** Generate header that can be used as server-timing */
Performance.prototype.generateHeader = function() {
	var header = "";
	// loop the metrics
	Object.keys(this.measures).forEach(name => {
		// if that timer is not ended, omit it.
		if (this.measures[name].measureStart) return;
		var desc = this.measures[name].desc + "(" + this.measures[name].invocations + "times)";
		header += name + "; dur=" + this.measures[name].time + '; desc="' + desc + '",';
	});

	// remove trailing comma and return header string
	return header.replace(/,\s*$/, "");
};

exports.Performance = Performance;

})();
