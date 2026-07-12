/*\
title: $:/plugins/tiddlywiki/performance/tests/test-perf-stats.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the statistics that decide whether a measured difference means anything.

\*/

"use strict";

describe("Performance statistics", function() {

	var stats = require("$:/plugins/tiddlywiki/performance/stats.js");

	it("reports the median and the spread", function() {
		expect(stats.median([1,2,3,4,5])).toBe(3);
		expect(stats.median([1,2,3,4])).toBe(2.5);
		expect(stats.coefficientOfVariationPct([10,10,10,10])).toBe(0);
		expect(stats.coefficientOfVariationPct([5,10,15,20])).toBeGreaterThan(40);
	});

	it("marks a scattered row as noisy, so no claim rests on it", function() {
		var steady = stats.summarise([10.0,10.1,9.9,10.0,10.1,9.9]),
			scattered = stats.summarise([2,18,5,25,3,30]);
		expect(steady.trust).toBe("ok");
		expect(scattered.trust).toBe("noisy");
		expect(scattered.resolvableEffectPct).toBeGreaterThan(steady.resolvableEffectPct);
	});

	it("reads a real improvement as an improvement", function() {
		var before = [10.0,10.2,9.8,10.1,10.0,9.9],
			after = [8.0,8.2,7.8,8.1,8.0,7.9],
			result = stats.comparePaired(before,after);
		expect(result.verdict).toBe("improvement");
		expect(result.ciHighPct).toBeLessThan(0);
	});

	it("reads a real regression as a regression", function() {
		var before = [10.0,10.2,9.8,10.1,10.0,9.9],
			after = [12.0,12.2,11.8,12.1,12.0,11.9],
			result = stats.comparePaired(before,after);
		expect(result.verdict).toBe("regression");
		expect(result.ciLowPct).toBeGreaterThan(0);
	});

	// The failure that started this: identical code, timed as the machine drifted, read as a change
	it("reads identical code as no change however far the machine drifts", function() {
		var before = [],
			after = [];
		for(var i = 0; i < 10; i++) {
			var drift = 10 + i * 5; // the machine slows steadily through the session
			before.push(drift);
			after.push(drift); // the same code, timed a moment later
		}
		var result = stats.comparePaired(before,after);
		expect(result.verdict).toBe("inconclusive");
		expect(result.deltaMeanPct).toBe(0);
	});

	// The pairing earns its keep here: the drift lands inside each pair and cancels
	it("finds a small real effect underneath a large drift", function() {
		var before = [],
			after = [];
		for(var i = 0; i < 10; i++) {
			var drift = i * 5; // the machine slows steadily through the session
			before.push(10 + drift);
			after.push(9 + drift); // a genuine one millisecond saving, dwarfed by the drift
		}
		var result = stats.comparePaired(before,after);
		expect(result.verdict).toBe("improvement");
	});

	it("refuses a verdict on too few pairs", function() {
		expect(stats.comparePaired([10],[9]).verdict).toBe("inconclusive");
	});

	it("refuses a verdict when the interval straddles zero", function() {
		var before = [10,12,9,11,10,12],
			after = [11,9,12,10,11,9],
			result = stats.comparePaired(before,after);
		expect(result.verdict).toBe("inconclusive");
		expect(result.ciLowPct).toBeLessThan(0);
		expect(result.ciHighPct).toBeGreaterThan(0);
	});
});
