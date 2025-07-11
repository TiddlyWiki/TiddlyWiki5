/*\
title: $:/core/modules/utils/performance.js
type: application/javascript
module-type: global

Performance measurement.

\*/

"use strict";

function Performance(enabled) {
	this.enabled = !!enabled;
	this.measures = {}; // Hashmap by measurement name of {time:, invocations:}
	this.logger = new $tw.utils.Logger("performance");
	this.showGreeting();
}

Performance.prototype.showGreeting = function() {
	if($tw.browser) {
		this.logger.log("Execute $tw.perf.log(); to see filter execution timings");
	}
};

/*
Wrap performance reporting around a top level function
*/
Performance.prototype.report = function(name,fn) {
	const self = this;
	if(this.enabled) {
		return function() {
			const startTime = $tw.utils.timer();
			const result = fn.apply(this,arguments);
			self.logger.log(`${name}: ${$tw.utils.timer(startTime).toFixed(2)}ms`);
			return result;
		};
	} else {
		return fn;
	}
};

Performance.prototype.log = function() {
	const self = this;
	let totalTime = 0;
	const orderedMeasures = Object.keys(this.measures).sort((a,b) => {
		if(self.measures[a].time > self.measures[b].time) {
			return -1;
		} else if(self.measures[a].time < self.measures[b].time) {
			return + 1;
		} else {
			return 0;
		}
	});
	$tw.utils.each(orderedMeasures,(name) => {
		totalTime += self.measures[name].time;
	});
	const results = [];
	$tw.utils.each(orderedMeasures,(name) => {
		const measure = self.measures[name];
		results.push({name,invocations: measure.invocations,avgTime: measure.time / measure.invocations,totalTime: measure.time,percentTime: (measure.time / totalTime) * 100});
	});
	self.logger.table(results);
};

/*
Wrap performance measurements around a subfunction
*/
Performance.prototype.measure = function(name,fn) {
	const self = this;
	if(this.enabled) {
		return function() {
			const startTime = $tw.utils.timer();
			const result = fn.apply(this,arguments);
			if(!(name in self.measures)) {
				self.measures[name] = {time: 0,invocations: 0};
			}
			self.measures[name].time += $tw.utils.timer(startTime);
			self.measures[name].invocations++;
			return result;
		};
	} else {
		return fn;
	}
};

exports.Performance = Performance;
